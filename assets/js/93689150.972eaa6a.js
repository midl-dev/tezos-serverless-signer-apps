"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[911],{3170:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>c,contentTitle:()=>o,default:()=>d,frontMatter:()=>r,metadata:()=>a,toc:()=>l});var t=n(5893),i=n(1151);const r={slug:"/deploy-consensus-signer",sidebar_position:2},o="Deploy a Consensus Signer",a={id:"deploy-consensus-signer",title:"Deploy a Consensus Signer",description:"At the end of this guide, you will get the Remote Signer URL for a Consensus Key Signer using Amazon Key Management System (KMS) as a backend.",source:"@site/docs/deploy-consensus-signer.md",sourceDirName:".",slug:"/deploy-consensus-signer",permalink:"/tezos-serverless-signer-apps/deploy-consensus-signer",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/deploy-consensus-signer.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{slug:"/deploy-consensus-signer",sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Tezos Signer Apps",permalink:"/tezos-serverless-signer-apps/"},next:{title:"Deploy an In-Memory Signer",permalink:"/tezos-serverless-signer-apps/deploy-in-memory-signer"}},c={},l=[{value:"Prerequisites",id:"prerequisites",level:2},{value:"Create a Baker Authorized Key",id:"create-a-baker-authorized-key",level:2},{value:"Pick a Region",id:"pick-a-region",level:2},{value:"Install the tezos-consensus-kms-signer app",id:"install-the-tezos-consensus-kms-signer-app",level:2},{value:"Retrieve the Consensus Public Key and Signer URL",id:"retrieve-the-consensus-public-key-and-signer-url",level:2}];function h(e){const s={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(s.h1,{id:"deploy-a-consensus-signer",children:"Deploy a Consensus Signer"}),"\n",(0,t.jsxs)(s.p,{children:["At the end of this guide, you will get the ",(0,t.jsx)(s.strong,{children:"Remote Signer URL"})," for a Consensus Key Signer using Amazon Key Management System (KMS) as a backend."]}),"\n",(0,t.jsx)(s.h2,{id:"prerequisites",children:"Prerequisites"}),"\n",(0,t.jsx)(s.p,{children:"You need:"}),"\n",(0,t.jsxs)(s.ul,{children:["\n",(0,t.jsx)(s.li,{children:"an existing baker setup, with an Octez node synchronized to the network of choice (Ghostnet, Mainnet...)"}),"\n",(0,t.jsx)(s.li,{children:"an AWS account"}),"\n"]}),"\n",(0,t.jsx)(s.h2,{id:"create-a-baker-authorized-key",children:"Create a Baker Authorized Key"}),"\n",(0,t.jsx)(s.p,{children:"Your remote signer URL will be publicly accessible. To protect it, we authenticate all requests with a key located on your baker."}),"\n",(0,t.jsxs)(s.p,{children:["This key must be a secp256k1 key (starting with ",(0,t.jsx)(s.code,{children:"tz2"}),")."]}),"\n",(0,t.jsx)(s.p,{children:"To create such key, on your baker node, run the following command:"}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{children:"octez-client gen keys kms-authorized-key --sig secp256k1\n"})}),"\n",(0,t.jsx)(s.p,{children:"Then take note of the public key:"}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{children:"octez-client show address kms-authorized-key\nHash: tz2QMsPySFa7DzQx9CWygur3gjrNHuWjpQw4\nPublic Key: sppk7b9Vxiryxtz6k26NHZsCCZGLa1hKMCgMsSrdxHeGBeHHvkUAmfe\n"})}),"\n",(0,t.jsxs)(s.p,{children:["This public key, starting with ",(0,t.jsx)(s.code,{children:"sppk"}),", must be passed to the serverless app during creation. Then, the app will know that the signature requests come from your baker."]}),"\n",(0,t.jsxs)(s.p,{children:["Read more about Authorized Keys in the ",(0,t.jsx)(s.a,{href:"https://tezos.gitlab.io/user/key-management.html#secure-the-connection",children:"Octez documentation"}),"."]}),"\n",(0,t.jsx)(s.h2,{id:"pick-a-region",children:"Pick a Region"}),"\n",(0,t.jsxs)(s.p,{children:["Your baker will send signature requests to the Serverless Function regularly, up to ",(0,t.jsx)(s.strong,{children:"8 times a minute"}),"."]}),"\n",(0,t.jsx)(s.p,{children:"For your baker to work reliably, it is important that the baker and the signer be in close geographical proximity."}),"\n",(0,t.jsxs)(s.p,{children:["Therefore, you must pick the AWS region closest to your baker. In this guide, we use ",(0,t.jsx)(s.code,{children:"us-east-2"})," (Ohio)."]}),"\n",(0,t.jsxs)(s.p,{children:["Log in to your AWS account and navigate to the ",(0,t.jsx)(s.a,{href:"https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/applications",children:"AWS Lambda Console"}),"."]}),"\n",(0,t.jsx)(s.p,{children:"On the top right of the console, pick your region of choice."}),"\n",(0,t.jsx)(s.p,{children:(0,t.jsx)(s.img,{alt:"KMS Region",src:n(5081).Z+"",width:"561",height:"268"})}),"\n",(0,t.jsx)(s.h2,{id:"install-the-tezos-consensus-kms-signer-app",children:"Install the tezos-consensus-kms-signer app"}),"\n",(0,t.jsxs)(s.p,{children:["From the ",(0,t.jsx)(s.a,{href:"https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/applications",children:"AWS Lambda Console"}),', on the left sidebar, select "Applications", then click "Create application". Then, choose "Serverless Application".']}),"\n",(0,t.jsx)(s.p,{children:'In the search bar, enter "tezos" and select "Show apps that create custom IAM roles or resource policies". Then, pick "tezos-consensus-kms-signer"'}),"\n",(0,t.jsx)(s.p,{children:(0,t.jsx)(s.img,{alt:"Create Lambda Application",src:n(2036).Z+"",width:"1376",height:"1015"})}),"\n",(0,t.jsxs)(s.ul,{children:["\n",(0,t.jsx)(s.li,{children:'under "Application name", enter "ACME-Bakery-Consensus-Signer" (replace with your bakery name).'}),"\n",(0,t.jsxs)(s.li,{children:['under "BakerAuthorizedKey", enter the public key (starting with ',(0,t.jsx)(s.code,{children:"sppk"}),") of your baker authorized key."]}),"\n"]}),"\n",(0,t.jsx)(s.p,{children:'Then, select "I acknowledge" and click "Deploy".'}),"\n",(0,t.jsx)(s.p,{children:(0,t.jsx)(s.img,{alt:"App Parameters",src:n(8161).Z+"",width:"775",height:"635"})}),"\n",(0,t.jsx)(s.h2,{id:"retrieve-the-consensus-public-key-and-signer-url",children:"Retrieve the Consensus Public Key and Signer URL"}),"\n",(0,t.jsx)(s.p,{children:"Wait one to 2 minutes and observe your resources being created."}),"\n",(0,t.jsx)(s.p,{children:'Then, select the "Deployments" tab and click the "CloudFormation stack" link.'}),"\n",(0,t.jsx)(s.p,{children:(0,t.jsx)(s.img,{alt:"Create Complete",src:n(1235).Z+"",width:"1818",height:"659"})}),"\n",(0,t.jsx)(s.p,{children:'Then, select the "Outputs" tab.'}),"\n",(0,t.jsx)(s.p,{children:(0,t.jsx)(s.img,{alt:"Stack output",src:n(6065).Z+"",width:"1112",height:"883"})}),"\n",(0,t.jsx)(s.p,{children:"Retrieve all three values:"}),"\n",(0,t.jsxs)(s.ul,{children:["\n",(0,t.jsxs)(s.li,{children:[(0,t.jsx)(s.strong,{children:"PublicKey"}),": the Consensus Public Key. You will need it to register."]}),"\n",(0,t.jsxs)(s.li,{children:[(0,t.jsx)(s.strong,{children:"PublicKeyHash"}),": the Consensus Public Key Hash."]}),"\n",(0,t.jsxs)(s.li,{children:[(0,t.jsx)(s.strong,{children:"SignerURL"}),": the URL of your Remote Signer."]}),"\n"]}),"\n",(0,t.jsxs)(s.p,{children:["You may test your signer URL with ",(0,t.jsx)(s.code,{children:"curl"})," by removing the public key hash from the URL and replacing it with ",(0,t.jsx)(s.code,{children:"authorized_keys"}),":"]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{children:"$ curl https://l1498fpieb.execute-api.us-east-2.amazonaws.com/prod/c28e79b248a8db9d0a4f7a33af2c5a3e/authorized_keys\n"})}),"\n",(0,t.jsx)(s.p,{children:"You should see the public key hash of your authorized key in the response."}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{children:'{"authorized_keys": ["tz2QMsPySFa7DzQx9CWygur3gjrNHuWjpQw4"]}\n'})}),"\n",(0,t.jsxs)(s.p,{children:["You may now proceed to the next step - ",(0,t.jsx)(s.a,{href:"register-consensus-key",children:"register a consensus key"})," for your baker."]})]})}function d(e={}){const{wrapper:s}={...(0,i.a)(),...e.components};return s?(0,t.jsx)(s,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},5081:(e,s,n)=>{n.d(s,{Z:()=>t});const t=n.p+"assets/images/kms-01-region-c30c99cc394e68ac2348af4546cda333.png"},2036:(e,s,n)=>{n.d(s,{Z:()=>t});const t=n.p+"assets/images/kms-02-create-application-75efface31e95c32e78ec00bf5648ec6.png"},8161:(e,s,n)=>{n.d(s,{Z:()=>t});const t=n.p+"assets/images/kms-03-app-parameters-a08f353382f6d5633091ff5f2713011d.png"},1235:(e,s,n)=>{n.d(s,{Z:()=>t});const t=n.p+"assets/images/kms-04-cloudformation-create-complete-7cc987a977d108ac02ed2d65702c44d7.png"},6065:(e,s,n)=>{n.d(s,{Z:()=>t});const t=n.p+"assets/images/kms-05-stack-outputs-6da8a5abc5d7ae2ae56325d2a7382fe1.png"},1151:(e,s,n)=>{n.d(s,{Z:()=>a,a:()=>o});var t=n(7294);const i={},r=t.createContext(i);function o(e){const s=t.useContext(r);return t.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function a(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),t.createElement(r.Provider,{value:s},e.children)}}}]);