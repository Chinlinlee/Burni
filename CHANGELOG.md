# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.6.0](https://github.com/Chinlinlee/Burni/compare/v2.5.0...v2.6.0) (2022-03-07)


### Features

* add logger ([ce60bf2](https://github.com/Chinlinlee/Burni/commit/ce60bf22dae8e4f25aafa31cd4acaa8d247b952d))
    - use log4js for logger
* add logger in FHIRAPI and refactor resFunc ([bff8643](https://github.com/Chinlinlee/Burni/commit/bff8643c56e8e8ca8d509c46c7d858b2c1642f27))
    - extract resFunc to global variable
    - add warn logger
* add new method for `$validate` API ([5b82908](https://github.com/Chinlinlee/Burni/commit/5b8290871767fa41f24f872e1824975836f021bb))
    - add `fhir-validator`
        - add `refreshResourceResolver` to call C# API to reload profiles
    	- add `storeValidationFile` to store `StructureDefinition`, `ValueSet`,
    	`CodeSystem`
    	- add `fetchValueSet` to get `ValueSet` resource by URL
    	- add `fetchCodeSystem` to get `CodeSystem` resource by URL
    	- add `validateByProfile` to validate resource by specific profile URL in URL path
    	- add `validateByMetaProfile` to validate resource by profiles URL from meta.profile
    - add `FHIRValidationFiles` MongoDB schema to store data about validation files
    - add schedule to update validation files in MongoDB
    - The validation workflow note can retrieve from 
![](https://i.imgur.com/68MBmp3.png)

* remove custom `fhir.js` and $validate API ([867e2b4](https://github.com/Chinlinlee/Burni/commit/867e2b4ca8823c8f7838e35b30f3ead37e926d51))
    - The fhir.js is not completly to do
    validation, need to find another solution
    - implement validator by self is too hard...
* resource interaction in metadata from config ([9c59674](https://github.com/Chinlinlee/Burni/commit/9c59674f43a3c203ca5c79717ca6fdcbc7ca0f83))
    - The interation of resource in metadata correspond to config

### Bug Fixes

* empty array entry of Bundle present ([fddf2f6](https://github.com/Chinlinlee/Burni/commit/fddf2f64c50743f23139d6db0657b50c1b59736c))
    - refact unique to bundle function
    - replace condition of total to entry length. I
think check entry length better than total

## [2.5.0](https://github.com/Chinlinlee/Burni/compare/v2.4.0...v2.5.0) (2022-02-24)


### Features

* `*` wildcard for `_include` and `revinclude` ([0361c7d](https://github.com/Chinlinlee/Burni/commit/0361c7d49ceec844be861e82663d81fdea30a696))
* add custom error class and `_include` param ([44af66f](https://github.com/Chinlinlee/Burni/commit/44af66f567cbf5334bb5aaab5f069a76d5b32623))
* add search mode in entry and change url ([2a9d2e8](https://github.com/Chinlinlee/Burni/commit/2a9d2e8e302f0e68f053e6bc6978de578ab03f67))
* handle `_revinclude` param in `search` API ([eb1e37c](https://github.com/Chinlinlee/Burni/commit/eb1e37c915ed845194f6cf8b15181bea083b9f36))
* **api-generate:** add apidoc in `create` api ([a83808b](https://github.com/Chinlinlee/Burni/commit/a83808bb1065178b976c7bbe79f02769c15377b0))
* **api-generate:** add apidoc in `update` api ([14fd32e](https://github.com/Chinlinlee/Burni/commit/14fd32e189815ea9e35ea8f0488464551843f2f8))
* **api-generator:** add `read` api doc comment ([e155de7](https://github.com/Chinlinlee/Burni/commit/e155de73496a497f24db0123ab3398e9b8cedbeb))
* **apidoc:** `delete`, swagger try in redoc, resource filter, layout ([bc57589](https://github.com/Chinlinlee/Burni/commit/bc57589845c16cc32a15b658ec782fda2f41c5d6))
* **apidoc:** add `search` api doc ([cc770a2](https://github.com/Chinlinlee/Burni/commit/cc770a297f05f27fe8979bff9fa8ea16842ffbd4))
* **docs:** reload page when click resource button ([d09547d](https://github.com/Chinlinlee/Burni/commit/d09547d872460111da924130e963386f8fa53437))
* **schema:** completly validate reference string ([d0a615c](https://github.com/Chinlinlee/Burni/commit/d0a615c39ac5c6479e4abd48464baca68e158af8))


### Bug Fixes

* cannot access even disable the token control ([2434a8e](https://github.com/Chinlinlee/Burni/commit/2434a8e1c162e68a4d84a86332c131c35a3d8b9b))
* cofused condition set search mode is include ([92e7659](https://github.com/Chinlinlee/Burni/commit/92e7659714774963c4589660e44bf7a87b6e8690))
* duplicate resource in bundle entry ([1567a12](https://github.com/Chinlinlee/Burni/commit/1567a1219d3506d12c6191f38b654c9c561a8e85))
* incorrect name in premision of `delete` API ([d9a4f9a](https://github.com/Chinlinlee/Burni/commit/d9a4f9a37b6af3ea1fec8fa9057dc1df8ea95d0d))
* infinite loop in `reinlcude` and `include` ([62ce4a0](https://github.com/Chinlinlee/Burni/commit/62ce4a086addaf516e2dbc1c4afb5b66663a91f0))
* missing `Last-Modified` in headers ([1fc14df](https://github.com/Chinlinlee/Burni/commit/1fc14df18a23ad0a7d809bb6062cb31f5df42624))
* missing handle error coming from express ([2fe878e](https://github.com/Chinlinlee/Burni/commit/2fe878e632f372817ba1cc2888b9958bc11cb5d5))
* not allowed `#id` contained reference id ([381fc0b](https://github.com/Chinlinlee/Burni/commit/381fc0bfbd80081272c25a24f930406e65ad557d))
* token permission not working ([750709f](https://github.com/Chinlinlee/Burni/commit/750709f8501efeb2a0caa755d0eadec60ef15825))

## [2.4.0](https://github.com/Chinlinlee/Burni/compare/v2.3.1...v2.4.0) (2022-02-07)


### Features

* add all resources definition json files ([0c34d96](https://github.com/Chinlinlee/Burni/commit/0c34d968d3ec02c379bf5d7d92f2eb9067d13a81))
* add condition delete API ([bf4b3a0](https://github.com/Chinlinlee/Burni/commit/bf4b3a08b35f1a2314bc0860a7760efc97c8c8b7))
* add general string query builder ([7cb186e](https://github.com/Chinlinlee/Burni/commit/7cb186e1988ffc6a4c99a98b5254892585d24b0c))
* add modifier of type of `string` and comma $or query in `address` query ([f12fca5](https://github.com/Chinlinlee/Burni/commit/f12fca528aeb438238133dec83b9c8d34918d178))
* change `validateContained` to async funtion ([0a30cd1](https://github.com/Chinlinlee/Burni/commit/0a30cd193fe8ef121688bab6de3484332534df84))
* change count of searching result method ([2b9751b](https://github.com/Chinlinlee/Burni/commit/2b9751bb695706beac287d3b5f9e5cdf2f5331ae))
* handle comma `,` query and esacaping `\,` and `\|` ([1a5bef6](https://github.com/Chinlinlee/Burni/commit/1a5bef63ef385c3e4a6057ccc1beb442f7fc4632))
* handle expression `where(type='${type}')` in the reference type search parameter ([17fe9b2](https://github.com/Chinlinlee/Burni/commit/17fe9b28379121133fdc02dc7908a7dc8b6232cd))
* separate parameter search functions to single file ([695219e](https://github.com/Chinlinlee/Burni/commit/695219e66b36ffad99ed7db9234ec64ebef5672c))
* **api-generator:** add `getPrefixCodeString` and change `TokenParameter` method ([a3a761b](https://github.com/Chinlinlee/Burni/commit/a3a761b25a573f59377512e59105933b0de01392))
* **api-generator:** add and change feature ([de51fea](https://github.com/Chinlinlee/Burni/commit/de51feaf8c0aba914ce1669bff8e4eea5dbb98f3))
* **api-generator:** add type of quantity search parameter ([0aab652](https://github.com/Chinlinlee/Burni/commit/0aab652743022013861098fc6ee0ed08cbbeb823))
* **api-generator:** new way to handle all data types of search parameter, change token query build and add jsdoc comments to methods ([c3d9e24](https://github.com/Chinlinlee/Burni/commit/c3d9e248bd92cf8719a46d672a2309ebbaa10299))
* **mongodb:** change connection url ([4b97705](https://github.com/Chinlinlee/Burni/commit/4b9770592ac4dbb8b56c3df4b46282c7fea8ebf6))
* **quantityQuery:** hanlde escaping `\` and using `$and` to handle query value ([f49edeb](https://github.com/Chinlinlee/Burni/commit/f49edebb90ce2e58201c7d94b8556087c4cd6913))
* **queryBuild:** add new query builder about date ([468ad6e](https://github.com/Chinlinlee/Burni/commit/468ad6e6b540dcbc21b220cce428761589969dea))
* **schema:** support unicode string ([597aba5](https://github.com/Chinlinlee/Burni/commit/597aba5fed1a6f6957c96e4a0dbc133656bd6871))


### Bug Fixes

* error of `eslint` rules ([1624240](https://github.com/Chinlinlee/Burni/commit/1624240a958e1e30e0fda1ee45a33c786f763369))
* eslint rule `semi`, `no-async-promise-executor` ([38ad62d](https://github.com/Chinlinlee/Burni/commit/38ad62d2a7eb18ebb7537e657a508703dff6c05b))
* generate incorrect back bone element schema ([0665447](https://github.com/Chinlinlee/Burni/commit/0665447092514a12737c1cc136580233df02f7c3))
* incorrect check is number condition in `numberQuery` ([8e29a16](https://github.com/Chinlinlee/Burni/commit/8e29a16d82b14743ab6c3597d0fbf2b705dacb3f))
* incorrect connection url ([2249d4a](https://github.com/Chinlinlee/Burni/commit/2249d4a29d01b0e9713a68b064e2bffa6dfc54ef))
* incorrect shard collection process flow ([1f853ce](https://github.com/Chinlinlee/Burni/commit/1f853ce624bc05795a384e1b44510f643fc6f600))
* missing `:exact` in object name ([5201ec1](https://github.com/Chinlinlee/Burni/commit/5201ec14e009f07fc2d46e9fac4c510e0f562e95))
* not allow array `field=1&field=2` parameter ([cbda323](https://github.com/Chinlinlee/Burni/commit/cbda3239775935b2908daf062d0043c2a51b4692))
* **api,create:** model `save()` method not using await ([cab23f0](https://github.com/Chinlinlee/Burni/commit/cab23f0605776ae45af256d56bddcd862448c5af))
* **api,update:** `isDocExist` return empty object ([630ac3d](https://github.com/Chinlinlee/Burni/commit/630ac3d01721137833c52e9816bb0fa0ea939c7a))
* **api,update:** missing `Last-modified` in header ([45f4c2a](https://github.com/Chinlinlee/Burni/commit/45f4c2afe300a21c7f3cbac380ac530d1d95b7db))
* model not load all dependencis type ([2d102d8](https://github.com/Chinlinlee/Burni/commit/2d102d81baaced34bf993b426e8a56e1ac6ae563))
* **resources-generator:** incorrect require path ([dc6b62b](https://github.com/Chinlinlee/Burni/commit/dc6b62b1ff39daad803549b4bfbcfe0803454769))
* **resources-generator:** mongoose circular dependency warnings ([d02a4ba](https://github.com/Chinlinlee/Burni/commit/d02a4ba46e563fc6be16c24bd513fa58e3a9e2af))

### [2.3.1](https://github.com/Chinlinlee/Burni/compare/v2.3.0...v2.3.1) (2022-01-23)


### Bug Fixes

* incorrect data type of `Date` when choice type[x] ([d32cb2d](https://github.com/Chinlinlee/Burni/commit/d32cb2d13ce289c4f750e3b0225404343f16065a))

## [2.3.0](https://github.com/Chinlinlee/Burni/compare/v2.2.0...v2.3.0) (2022-01-22)


### Features

* add `shardKey` config in history schema ([419bae7](https://github.com/Chinlinlee/Burni/commit/419bae714e10e7e550f1e9a2c4f46af08d97995f))


### Bug Fixes

* remove choice type [x] generate in schema ([f3a35b7](https://github.com/Chinlinlee/Burni/commit/f3a35b72ecaa776dd3b7fa359a463647043a9097))
* remove choice type [x] generate in schema ([309ce6b](https://github.com/Chinlinlee/Burni/commit/309ce6b5d20a4d1a78ee30f2bab006a9db1b1816))

## [2.2.0](https://github.com/Chinlinlee/Burni/compare/v2.1.0...v2.2.0) (2022-01-21)


### Features

* add `_lastUpdated` search parameter ([6ab6f04](https://github.com/Chinlinlee/Burni/commit/6ab6f044f6a65fe0c7ac4d6bcb4bb09a983c1ce8))
* add `contained` field in schema ([7712dc2](https://github.com/Chinlinlee/Burni/commit/7712dc2698a41c8005ab6f9a77a7d8e42aea4e37))
* add check reference switch ([9c5e860](https://github.com/Chinlinlee/Burni/commit/9c5e8603089b8292b0865cec909f7a2e47ef68a8))
* add condition that whether response item in body or not ([807154b](https://github.com/Chinlinlee/Burni/commit/807154bb2b14aadb2ce60ce72bc0aba444853cbd))
* add condition whether check the stored resource ID ([d21442a](https://github.com/Chinlinlee/Burni/commit/d21442abcba9e7fbb49bbb2b83d8c1dbefd904b8))
* add last-modified in headers ([25c84cb](https://github.com/Chinlinlee/Burni/commit/25c84cbed73e813091c70407b3057665f459b811))
* add refresh_token ([e30ac2c](https://github.com/Chinlinlee/Burni/commit/e30ac2ca98d923e90bf02321592836813dc4427a))
* apply specific rule with `List` resource ([b688eb2](https://github.com/Chinlinlee/Burni/commit/b688eb2f8b042da9174a3c10e8d2b4f670d5561a))
* refresh_token api ([095efb7](https://github.com/Chinlinlee/Burni/commit/095efb7965af2a66575e388bfaec5d7b23032f63))
* remove method that response empty when create and update ([56f8358](https://github.com/Chinlinlee/Burni/commit/56f83589a9e543072eda3c51e60be9ad54eaabd2))
* shard database and every collections when starting up ([c58c8a4](https://github.com/Chinlinlee/Burni/commit/c58c8a41dc2ba60b100d8b5194c6b5cd16a88909))


### Bug Fixes

* _doc is not function, ([f6a2678](https://github.com/Chinlinlee/Burni/commit/f6a2678aaca52d387444740f5805ebf7d3b612f3))
* `history` mongoose response document will fill undefined in not exist field ([7d7bf85](https://github.com/Chinlinlee/Burni/commit/7d7bf850c5b768b85c86b119b3cb8b3c8c09a135))
* `resource.meta` incorrect after updating ([9439334](https://github.com/Chinlinlee/Burni/commit/9439334decc7ba01ebff7d7a270cceafd22e55e4))
* backBoneElement not use getter with mongoose schema ([0776c38](https://github.com/Chinlinlee/Burni/commit/0776c38cddf0be1c1df755ce2a8dcaf7fc506136))
* FHIR package not import ([ce1a85b](https://github.com/Chinlinlee/Burni/commit/ce1a85b371eb7d9794444b72686b35ce12444bde))
* generate incorrect code at numer query search parametr ([789b435](https://github.com/Chinlinlee/Burni/commit/789b43587206bf15a992ddf726f678420800a597))
* generate incorrect search field of type of token ([e377476](https://github.com/Chinlinlee/Burni/commit/e377476b0af8356864b26f942400dda95ca08412))
* incorrect argument name  `err is not defined` ([9bc9ac9](https://github.com/Chinlinlee/Burni/commit/9bc9ac9b7fc7924d6303e3fee059649077faec6a))
* incorrect countDocuments collection in `history` ([8a7cb9b](https://github.com/Chinlinlee/Burni/commit/8a7cb9b0257b55884aff39f104cff8432cc032e9))
* incorrect date format ([7788eb9](https://github.com/Chinlinlee/Burni/commit/7788eb9cfb91254b6ed71753b772c1085d8e41d6))
* incorrect format of metadata rest ([2f6ec60](https://github.com/Chinlinlee/Burni/commit/2f6ec60ae841742e16933029e17e9fd783ec4410))
* incorrect log when error occur ([2a60bcc](https://github.com/Chinlinlee/Burni/commit/2a60bcc3d61b3843df56e73a9e188441010147de))
* incorrect name of type, is `instant` not `instance` ([e876ce6](https://github.com/Chinlinlee/Burni/commit/e876ce68f2b92813ef58e6d0fef868068ed45f37))
* incorrect variable name ([d7a834d](https://github.com/Chinlinlee/Burni/commit/d7a834dc6e0a090c10c2f0cdc739953c0761e418))
* missing `Location` in headers when statu code 201 ([8092545](https://github.com/Chinlinlee/Burni/commit/809254596085582d95f22a63d66260d991057613))
* missing condition that server is enable token auth ([d335756](https://github.com/Chinlinlee/Burni/commit/d335756cf11931bf42f86114081c93caf0596fce))
* missing delete __v in doc ([fe0401e](https://github.com/Chinlinlee/Burni/commit/fe0401e4ba8da5104f6b580e2d90da85a2e3f128))
* missing placeholder in search input ([04c2403](https://github.com/Chinlinlee/Burni/commit/04c24032e8538e7be10a36c1b6c57b6f1f930d9c))
* missing variable name and require modules ([d40cf7f](https://github.com/Chinlinlee/Burni/commit/d40cf7feee7d6c51e623d4dddb3f078f4ac4ff66))
* mongoose response document will fill undefined in not exist field ([fa5a73d](https://github.com/Chinlinlee/Burni/commit/fa5a73d37d04fdfc7a74b72060badc327a09105b))
* not handle convert XML to JSON when content is XML which using PUT ([543f7b7](https://github.com/Chinlinlee/Burni/commit/543f7b7c99052ad72f6be7f441aa1bbd023caf04))
* port is not defiend ([2d8fc29](https://github.com/Chinlinlee/Burni/commit/2d8fc298c3c3e9f5529da3793e6eda94a4d83372))
* put list missing double quote ([68d4ad0](https://github.com/Chinlinlee/Burni/commit/68d4ad06248cd50e04cfe1237e686a09fc1c1a4d))
* resolve body in a request is empty when content-type is XML ([d7eabc3](https://github.com/Chinlinlee/Burni/commit/d7eabc3846513a7160ae181f6af1ae7c8352db05))
* resolve problem that port with bundle url and http server is same ([d50e66c](https://github.com/Chinlinlee/Burni/commit/d50e66c1a925344e737e368642e42cb084de6d0b))
* resolve that input is null the getter will response the default value ([eb9e361](https://github.com/Chinlinlee/Burni/commit/eb9e361a68db79b4c28de96b0486a28647e4c0ce))
* resolve that missing store history data when PUT recovery data after deleting ([12188cc](https://github.com/Chinlinlee/Burni/commit/12188cc3cd1bf1c08694dcfa926bde2c55f4ef1e))
* resolve the delete not exist resource return incorrect HTTP response code ([f63be17](https://github.com/Chinlinlee/Burni/commit/f63be170ace10edae5d2889600a7033712b7c6ee))
* resolve the problem that time of primitive type can't store in schema ([672fb63](https://github.com/Chinlinlee/Burni/commit/672fb6335c98649edf41d627927288813c674594))
* the filed name `collection` cannot in schema ([ca90dba](https://github.com/Chinlinlee/Burni/commit/ca90dba2bfd5175c9c2ccaa9434a7905eecf4d2d))
* uri and url occur document fill undefiend in not exist field ([5e14881](https://github.com/Chinlinlee/Burni/commit/5e14881897606bc52c0a9d25ae77f28c4ca7fa5a))
* URI values cannot have whitespace ([e3096e2](https://github.com/Chinlinlee/Burni/commit/e3096e22f34bb744167e912aa8b2c0ce837e124a))
* use toObject will fil undefiend in not exist field ([bd98969](https://github.com/Chinlinlee/Burni/commit/bd98969799fd35ce281bc68fc92393974af39f0f))

## [2.1.0](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/compare/v2.0.0...v2.1.0) (2021-09-29)


### Features

* add checkTokenPermission in every api service ([1df5f0b](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/1df5f0b3ac103b6cd6c877895b5e767c65662616))
* add cookie expires time ([7379c09](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/7379c09e2e5e023b8e8e87120acf4b35b3c1f69a))
* add instant query ([c8282a4](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/c8282a4bafd186b568a7c5a12cb0eb17b9eb50b9))
* add resourceTypes model ([d511051](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/d511051e09cf92c1e0f2d49d17c301dce77121ab))
* add some FHIR operation outcome message ([6ce5b74](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/6ce5b744350e7edc41ed82173904e61ea2bd4276))
* add toke service ([f1541ef](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/f1541efc9d54685136b5483fae566ed291c1f7ff))
* change every restful api point to same function ([d5b7747](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/d5b77474c380cf2567180a41bbde1a7820f1bafe))
* change the method of storing token ([153b866](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/153b8663d074ac57e174fe5eb0f7a90539f7c8e1))
* check reference handle uuid ([9703f84](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/9703f841d54ae7e2db8c3f7580926f4a518d909a))
* generate config that have interaction of resources ([e41fbc7](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/e41fbc7c6a6a66bb3b11803c13a0f7cce91f6c45))
* parseing multiple value set ([092aa84](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/092aa8472e538821bcb865855f841ebcde1e8a79))
* send 401 when decode token error ([451de08](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/451de08968f9c2740131b2e500a974f5f36fe799))
* support multiple fields in search parameter ([8c39d54](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/8c39d54dce53d04afb791d2f0341264f9fbd783a))
* update complex type schema ([3df86cd](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/3df86cd731b16cfd99c7ec9eb0dd83d1236b7b02))
* using search instead of pagination ([b268546](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/b268546517f3a8e9f7f6c7aa0bdcc92e335dff95))


### Bug Fixes

* get api exception not use operationOutcome ([d747cfd](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/d747cfd1d528b028db029aef011fd89ac18c8563))
* histroy version query error ([a8bd267](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/a8bd267f41b196368a42c947423b31768b4c2f57))
* id index every typy that have id ([bdc76f0](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/bdc76f0bd16e957ae42a43d07ad074b91b495038))
* incorrect arguments in toeknQuery function ([0071d8d](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/0071d8d060a5650b234779564ef9828a2499f70e))
* incorrect pagination ([bfcda46](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/bfcda4640a31d7b20d08152a00241c5297ce4ebf))
* incorrect token query function arg ([fe5992d](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/fe5992deeb5e517ee15874dc0ca99805ebe8ebbd))
* resolve meta not assign original ([5386782](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/5386782b8dd743d54932daa54ef4939797d1cda3))
* schema use incorrect field with meta versionId ([adfe0e4](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/adfe0e488e3e3d0d1f2f525bd2c4643a96232176))
* the bundle entry not unset when total is zero ([4a1466e](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/4a1466eeb2841a3038ae1d8417308d90f5c8f797))
* validate generator not using dynamic resourceType ([c47e5c3](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/c47e5c3b24041a9f47ffd4459da445d450404075))

## 2.0.0 (2021-06-20)


### ⚠ BREAKING CHANGES

* FHIR-mongoose-Models-Generator `index.js` deprecated

feat: add search parameter of type of reference generator

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Note> that deceased of parameter in Patient incorrect

feat!: change generate resources method

Use the `resoueceGenerator.js` now
* FHIR-mongoose-Models-Generator `index.js` deprecated

feat: add sort _id in getHistory api

feat: add sort _id in get api

feat: ignore text and meta field in request body

feat: check id of new resource is stored in database

The FHIR logical ID is unique in `ALL` resource
1. stored the id of new resource (post.save)
2. check id before data save (pre.save)

feat: exit when build finished

fix: default seach code field when type is token

fix: generate incorrect history file

add condition to check model name is in resource list

fix: delete api not return FHIR OperationOutcome when error

chore: bump lodash to version 4.17.21

chore: add mongoose-schema-jsonschema package

chore: update gitignore

1. Ignore temp folder
2. Remove not exist folder
3. Not ignore FHIRStoredID mongo model

### Features

* add FHIR base type in project ([ba8c23c](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/ba8c23cbefe57717b2129c0b9c3af810eddee4da))
* Add some parameter in searching ([041d318](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/041d318086131badc7710ea18b385859685dfd34))
* Added generate patient example ([5ffcdc1](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/5ffcdc14f85f64e6fca0c857a19a8b4abf70c856))
* Added get history Bundle feature ([faa3e9c](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/faa3e9cf9a141085a72abd33ced36458588049a6))
* Added patient model example ([a4ec349](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/a4ec3490334e44e6e50dbc29ca9486b62dafb1e9))
* remove versionkey in mongoose schema ([4ba05df](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/4ba05df9e75c1690b86681ec8c034ece1a2df96f))
* **index:** Added history feature ([3277706](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/32777061685b2eecfa86919ff729aa996f18e289))
* Added resource version column ([998a95a](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/998a95abd30fbdc22a4e42e36b9067d3aedaec45))


### Bug Fixes

* Error code ([f0e8c87](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/f0e8c8769a409d1dcb265cf1860a57daa3a528ee))
* exit when env not config ([be4f338](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/be4f338820d15055a425c20b847241c05cd774dd))
* incorrect ignore file ([973523c](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/973523c4fd33d243eed109ed6602c91f54325a4a))
* post not ignore text and meta field ([92e9490](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/92e9490f528ced7be7e87a349a172960386aef4b))
* resource incorrect obj key in post save ([af4763d](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/af4763dd184838c165ffe78578487c8d0842c062))
* some related type not import in file ([d3e1e11](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/d3e1e117d79b5ce153bf179c82702de48ae267a9))
* update metadata ([3408854](https://github.com/Chinlinlee/Simple-Express-FHIR-Server/commit/34088548d3940e14b73043255c4de5052d02a7d5))
