# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
