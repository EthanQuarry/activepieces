
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { postStatus } from './lib/actions/post-status';

const markdownDescription = `
**Base Url**: The base url of your Mastodon instance (e.g \`https://mastodon.social\`)

**Access Token**: To get your access token, follow the steps below:

1. Go to your **Profile** -> **Preferences** -> **Development** -> **New Application**
2. Fill the Information
3. Click on **Create Application**
4. Copy access token from **Your access token**
`;

export const mastodonAuth = PieceAuth.CustomAuth({
    
    description: markdownDescription,
    props: {
        base_url: Property.ShortText({
            displayName: 'Base URL',
            description: 'The base URL of your Mastodon instance',
            defaultValue: "https://mastodon.social/",
            required: true,
        }),
        access_token: Property.ShortText({
            displayName: 'Access Token',
            description: 'The access token for your Mastodon account, check the documentation for how to get this',
            required: true
        })
    },
    required: true
})

export const mastodon = createPiece({
  displayName: 'Mastodon',

    logoUrl: 'https://cdn.activepieces.com/pieces/mastodon.png',
    minimumSupportedRelease: '0.5.0',
  authors: [
    "abuaboud"
  ],
  auth: mastodonAuth,
  actions: [
    postStatus
  ],
  triggers: [
  ],
});
