const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const resourceList = require('./assets/FHIR/fhir.resourceList.json');
const API_DOC_OUT_DIR = "temp/doc/swagger.3.json";
function getExistResources() {
    return new Promise((resolve, reject) => {
        let existResources = [];
        for (let resourceListIndex = 0 ; resourceListIndex < resourceList.length; resourceListIndex++) { 
            let resourceType = resourceList[resourceListIndex];
            let apiFilePath = path.resolve(__dirname, `../api/FHIR/${resourceType}`);
            fs.stat(apiFilePath, function(err, stat){
                if (!err) {
                    existResources.push({
                        resourceType: resourceType,
                        path: apiFilePath
                    });
                }
                if (resourceListIndex == resourceList.length - 1) resolve(existResources);
            });
        }
    })

}

async function generateReDocHtml() {
    let existResources = await getExistResources();
    let htmlStr = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link href="index.css" rel="stylesheet">
</head>
<body>
    <div class="main mt-3">
    <div class="text-center mb-5">
        <div class="card-header">
        Resources
        </div>
        <div class="card-body">
        ${(()=> {
            let resourcesBtnHtml = "";
            for(let resource of existResources) {
                let btnId = `btn-${resource.resourceType.toLowerCase()}`;
                resourcesBtnHtml += `<button class="btn btn-outline-secondary mt-2 mb-2" id="${btnId}" onclick="redocInit('${resource.resourceType}/swagger.json', '${btnId}')">${resource.resourceType}</button>\r\n        `;
            }
            return resourcesBtnHtml;
        })()}
        </div>
    </div>
    <redoc id="redoc"></redoc>
    </div>
</body>
</html>
<script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
<script src="index.js"></script>
    `;
    let outPath = path.join(__dirname, "apidoc/redoc/index.html");
    fs.writeFileSync(outPath, htmlStr);
}

async function generateOpenAPIJsonFiles() {
    let existResources = await getExistResources();
    for(let resource of existResources) {
        exec(`apidoc-swagger -i ${resource.path} -o ${API_DOC_OUT_DIR}/${resource.resourceType} --openapi-version 3`, function(err, stdout, stderr) {
            if (err | stderr) {
                let error = err | stderr;
                throw error;
            }
            console.log(`successfully create ${resource.resourceType} openapi json`);
        });
    }
}
generateOpenAPIJsonFiles();
generateReDocHtml();