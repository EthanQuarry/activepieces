import {
    apId,
    Cursor,
    ExecutionOutputStatus,
    FileId,
    FlowRun,
    FlowRunId,
    FlowVersionId,
    ProjectId,
    SeekPage,
    RunEnvironment,
    TelemetryEventName,
    FlowId,
    spreadIfDefined,
} from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { telemetry } from '../../helper/telemetry.utils'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunSideEffects } from './flow-run-side-effects'
import { logger } from '../../helper/logger'
import { notifications } from '../../helper/notifications'
import { flowRepo } from '../flow/flow.repo'

export const repo = databaseConnection.getRepository(FlowRunEntity)

export const flowRunService = {
    async list({ projectId, flowId, status, cursor, limit }: ListParams): Promise<SeekPage<FlowRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: FlowRunEntity,
            query: {
                limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo.createQueryBuilder('flow_run').where({
            projectId,
            ...spreadIfDefined('flowId', flowId),
            ...spreadIfDefined('status', status),
            environment: RunEnvironment.PRODUCTION,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<FlowRun>(data, newCursor)
    },

    async finish(
        flowRunId: FlowRunId,
        status: ExecutionOutputStatus,
        logsFileId: FileId | null,
    ): Promise<FlowRun> {
        await repo.update(flowRunId, {
            logsFileId,
            status,
            finishTime: new Date().toISOString(),
        })
        const flowRun = (await this.getOne({ id: flowRunId, projectId: undefined }))!
        notifications.notifyRun({
            flowRun: flowRun,
        })
        return flowRun
    },

    async start({ flowVersionId, payload, environment }: StartParams): Promise<FlowRun> {
        logger.info(`[flowRunService#start]  flowVersionId=${flowVersionId}`)

        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const flow = (await flowRepo.findOneBy({ id: flowVersion.flowId }))!

        const flowRun: Partial<FlowRun> = {
            id: apId(),
            projectId: flow.projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            environment: environment,
            flowDisplayName: flowVersion.displayName,
            status: ExecutionOutputStatus.RUNNING,
            startTime: new Date().toISOString(),
        }

        const savedFlowRun = await repo.save(flowRun)

        telemetry.trackProject(flow.projectId, {
            name: TelemetryEventName.FLOW_RUN_CREATED,
            payload: {
                projectId: savedFlowRun.projectId,
                flowId: savedFlowRun.flowId,
                environment: savedFlowRun.environment,
            },
        })
        await flowRunSideEffects.start({
            flowRun: savedFlowRun,
            payload,
        })

        return savedFlowRun
    },

    async getOne({ projectId, id }: GetOneParams): Promise<FlowRun | null> {
        return await repo.findOneBy({
            projectId,
            id,
        })
    },
}


type ListParams = {
    projectId: ProjectId
    flowId: FlowId | undefined
    status: ExecutionOutputStatus | undefined
    cursor: Cursor | null
    limit: number
}

type GetOneParams = {
    id: FlowRunId
    projectId: ProjectId | undefined
}

type StartParams = {
    environment: RunEnvironment
    flowVersionId: FlowVersionId
    payload: unknown
}
