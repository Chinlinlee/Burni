# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
