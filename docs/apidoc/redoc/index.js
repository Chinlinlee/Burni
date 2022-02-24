function changeResource(resource) {
    let url = new URL(window.location.href);
    url.searchParams.set("resource", resource);
    window.location.href = url.href;
}

function filterResourcesBtn(id) {
    let input = document.getElementById(id);
    let qs = input.value.toLowerCase();
    let filterClearBtn = document.getElementById("filter-clear");
    if (!qs) filterClearBtn.style.display = "none";
    else filterClearBtn.style.display = "inline-block";
    let btnList = document.querySelectorAll(`[id*=btn-]`);
    btnList.forEach((element, key, parent) => {
        if (!qs) element.style.display = "inline-block";
        if (!element.id.includes(qs)) {
            element.style.display = "none";
        } else {
            element.style.display = "inline-block";
        }
    });
}

function init() {
    let filterClearBtn = document.getElementById("filter-clear");
    filterClearBtn.style.display = "none";
    filterClearBtn.onclick = function() {
        let input = document.getElementById("resource-filter");
        input.value = "";
        filterResourcesBtn("resource-filter");
    }
    let url = new URL(window.location.href);
    let resourceType = url.searchParams.get("resource");
    if (resourceType) {
        let btnId = `btn-${resourceType.toLowerCase()}`;
        let btn = document.getElementById(btnId);
        btn.classList.remove("btn-outline-secondary");
        btn.classList.add("btn-secondary");
        let specUrl = `${resourceType}/swagger.json`;
        initTry({
            openApi: specUrl
        });
    }
}

init();