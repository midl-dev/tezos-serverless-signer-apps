// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
import { themes as prismThemes } from 'prism-react-renderer';

const config = {
  title: 'Tezos Serverless Signer Apps',
  favicon: 'img/favicon.ico',
  url: 'https://midl-dev.github.io/',
  baseUrl: '/tezos-serverless-signer-apps/',
  organizationName: 'MIDL.dev', // Update this to your GitHub org/user name.
  projectName: 'tezos-serverless-signer-apps', // Update this to your repo name.
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          // Setting the routeBasePath to '/' makes docs the root of the site
          routeBasePath: '/',
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        // Disable blog feature
        blog: false,
      },
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Tezos Serverless Signer Apps',
      logo: {
        alt: 'MIDL.dev Logo',
        src: 'img/logo.png',
      },
      items: [
        // Remove or comment out the blog link and any other unnecessary items
        // Keeping only the necessary links for documentation
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Go to Serverless App on AWS',
          href: "https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-consensus-kms-signer"
        },
        {
          href: 'https://github.com/midl-dev/tezos-serverless-signer-apps',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        // Update footer links as needed for your documentation
        {
          title: 'Docs',
          items: [
            {
              label: 'Docs',
              to: '/',
            },
          ],
        },
        // You can add or remove footer links as needed
      ],
      copyright: `Copyright © ${new Date().getFullYear()} MIDLDEV OU. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;

