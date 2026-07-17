# searchParameterQueryHandler (/docs/code-api-documentation/models/fhir/search-parameter-query-handler)



This file is in `models/FHIR/`.

## Functions [#functions]

<dl>
  <dt>
    <a href="#getStringQuery">getStringQuery(query, paramsSearchFields, queryFieldName)</a>
  </dt>

  <dd />

  <dt>
    <a href="#getAddressQuery">getAddressQuery(query, queryFieldName)</a>
  </dt>

  <dd />

  <dt>
    <a href="#getNameQuery">getNameQuery(query, queryFieldName)</a>
  </dt>

  <dd />

  <dt>
    <a href="#getTokenQuery">getTokenQuery(query, paramsSearchFields, queryFieldName)</a>
  </dt>

  <dd />

  <dt>
    <a href="#getPolyTokenQuery">getPolyTokenQuery(query, paramsSearchFields, queryFieldName, paramsSearchFunc)</a>
  </dt>

  <dd />

  <dt>
    <a href="#getNumberQuery">getNumberQuery(query, paramsSearchFields, queryFieldName)</a>
  </dt>

  <dd />

  <dt>
    <a href="#getPolyDateQuery">getPolyDateQuery(query, paramsSearchFields, queryFieldName, paramsSearchFunc)</a>
  </dt>

  <dd />
</dl>

<a name="getStringQuery" />

## getStringQuery(query, paramsSearchFields, queryFieldName) [#getstringqueryquery-paramssearchfields-queryfieldname]

**Kind**: global function

| Param              | Type                         | Description                                     |
| ------------------ | ---------------------------- | ----------------------------------------------- |
| query              | <code>string</code>          | The request query object                        |
| paramsSearchFields | <code>Array.\<string></code> | The fields of search parameter that in resource |
| queryFieldName     | <code>string</code>          | The name of search parameter                    |

**Example*&#x2A; &#x2A;(Example of \`address-city\` of search parameter of the Patient resource)*

```js
// refresh query object to 
// {
//    "$and": [
//       {
//           "$or": [
//               {
//                   "address.city": {
//                       "$regex": /^PleasantVille/gi
//                   }
//               }
//          ]
//      }
//   ]
// }
getStringQuery(
{
   "address-city": "PleasantVille",
   "gender": "male",
   "$and": []
}, ["address.city"], "address-city");
```

<a name="getAddressQuery" />

## getAddressQuery(query, queryFieldName) [#getaddressqueryquery-queryfieldname]

**Kind**: global function

| Param          | Type                | Description                  |
| -------------- | ------------------- | ---------------------------- |
| query          | <code>string</code> | The request query object     |
| queryFieldName | <code>string</code> | The name of search parameter |

**Example*&#x2A; &#x2A;(Example of \`address\` of search parameter of the Patient resource)*

```js
// refresh query object to 
// {
//     "$and": [
//         {
//             "$or": [
//                 {
//                     "address.line": {
//                         "$regex": /^PleasantVille/gi
//                     }
//                 },
//                 {
//                     "address.city": {
//                         "$regex": /^PleasantVille/gi
//                     }
//                 },
//                 {
//                     "address.district": {
//                         "$regex": /^PleasantVille/gi
//                     }
//                 },
//                 {
//                     "address.state": {
//                         "$regex": /^PleasantVille/gi
//                     }
//                 },
//                 {
//                     "address.postalCode": {
//                         "$regex": /^PleasantVille/gi
//                     }
//                 },
//                 {
//                     "address.country": {
//                         "$regex": /^PleasantVille/gi
//                     }
//                 }
//             ]
//         }
//     ]
// }
getAddressQuery(
{
   "address": "PleasantVille",
   "gender": "male",
   "$and": []
}, "address");
```

<a name="getNameQuery" />

## getNameQuery(query, queryFieldName) [#getnamequeryquery-queryfieldname]

**Kind**: global function

| Param          | Type                | Description                  |
| -------------- | ------------------- | ---------------------------- |
| query          | <code>string</code> | The request query object     |
| queryFieldName | <code>string</code> | The name of search parameter |

**Example*&#x2A; &#x2A;(Example of \`name\` of search parameter of the Patient resource)*

```js
// refresh query object to 
// {
//     "$and": [
//         {
//             "$or": [
//                 {
//                     "$or": [
//                         {
//                             "name.text": {
//                                 "$regex": /^Chalmers/gi
//                             }
//                         },
//                         {
//                             "name.family": {
//                                 "$regex": /^Chalmers/gi
//                             }
//                         },
//                         {
//                             "name.given": {
//                                 "$regex": /^Chalmers/gi
//                             }
//                         },
//                         {
//                             "name.suffix": {
//                                 "$regex": /^Chalmers/gi
//                             }
//                         },
//                         {
//                             "name.prefix": {
//                                 "$regex": /^Chalmers/gi
//                             }
//                         }
//                     ]
//                 }
//             ]
//         }
//     ]
// }
```

**Example**

```js
getNameQuery(
{
    "name": "Chalmers"
}, ["name"], "name");
```

<a name="getTokenQuery" />

## getTokenQuery(query, paramsSearchFields, queryFieldName) [#gettokenqueryquery-paramssearchfields-queryfieldname]

**Kind**: global function

| Param              | Type                         | Description                                     |
| ------------------ | ---------------------------- | ----------------------------------------------- |
| query              | <code>string</code>          | The request query object that in resource       |
| paramsSearchFields | <code>Array.\<string></code> | The fields of search parameter that in resource |
| queryFieldName     | <code>string</code>          | The name of search parameter                    |

<a name="getPolyTokenQuery" />

## getPolyTokenQuery(query, paramsSearchFields, queryFieldName, paramsSearchFunc) [#getpolytokenqueryquery-paramssearchfields-queryfieldname-paramssearchfunc]

**Kind**: global function

| Param              | Type                         | Description                                                                    |
| ------------------ | ---------------------------- | ------------------------------------------------------------------------------ |
| query              | <code>Object</code>          | The request query object                                                       |
| paramsSearchFields | <code>Array.\<string></code> | The fields of search parameters that in resource                               |
| queryFieldName     | <code>string</code>          | The name of search parameter                                                   |
| paramsSearchFunc   | <code>function</code>        | parameter search function corresponds to data type e.g. code, codeable concept |

**Example*&#x2A; &#x2A;(Example of \`address-use\` of search parameter of the Patient resource)*

```js
// refresh query object to 
// {
//     "$and": [
//         {
//             "$or": [
//                 {
//                     "$or": [
//                         {
//                             "address.use.system": "home" //because some data types have system 
//                         },
//                         {
//                             "address.use": "home"
//                         }
//                     ]
//                 }
//             ]
//         }
//     ]
// }
getPolyTokenQuery(
{
    "address-use": "home"
}, ["address.use"], "address-use", (query)=> {
    try {
          queryHandler.getStringQuery(query, paramsSearchFields, *"address-city");
      } catch (e) {
          console.error(e);
          throw e;
      }
});
```

<a name="getNumberQuery" />

## getNumberQuery(query, paramsSearchFields, queryFieldName) [#getnumberqueryquery-paramssearchfields-queryfieldname]

**Kind**: global function

| Param              | Type                         | Description                                      |
| ------------------ | ---------------------------- | ------------------------------------------------ |
| query              | <code>string</code>          | The request query object                         |
| paramsSearchFields | <code>Array.\<string></code> | The fields of search parameters that in resource |
| queryFieldName     | <code>string</code>          | The name of search parameter                     |

**Example*&#x2A; &#x2A;(Example of \`variant-start\` of search parameter of the Molecularsequence resource)*

```js
// refresh query object to 
// {
//     "$and": [
//         {
//             "$or": [
//                 {
//                     "variant.start": {
//                         "$eq": 22125503
//                     }
//                 }
//             ]
//         }
//     ]
// }
getNumberQuery(
{
    "$and": [], 
    "variant-start" : 22125503
}, ["variant.start"], "variant-start");
```

<a name="getPolyDateQuery" />

## getPolyDateQuery(query, paramsSearchFields, queryFieldName, paramsSearchFunc) [#getpolydatequeryquery-paramssearchfields-queryfieldname-paramssearchfunc]

**Kind**: global function

| Param              | Type                  | Description                                                            |
| ------------------ | --------------------- | ---------------------------------------------------------------------- |
| query              | <code>Object</code>   | The request query object                                               |
| paramsSearchFields | <code>string</code>   | The fields of search parameters that in resource                       |
| queryFieldName     | <code>string</code>   | The name of search parameter                                           |
| paramsSearchFunc   | <code>function</code> | parameter search function corresponds to data type e.g. date, dateTime |
