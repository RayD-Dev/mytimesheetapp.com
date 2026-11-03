<#-- Page shell for every Keycloak login page (docs/screens/sign-in.md, Layout).
     Pages call it as <@layout.registrationLayout ...; section> with "header" (the h1),
     "form", and optionally "info" and "socialProviders". -->
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${(locale.currentLanguageTag)!'en'}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${msg("loginTitle")}</title>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
    <link rel="stylesheet" href="${url.resourcesPath}/${style}">
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
    <script defer src="${url.resourcesPath}/${script}"></script>
        </#list>
    </#if>
</head>
<body>
<div class="page">
    <main class="column">
        <#-- C-3: no stored business name or logo in slice 1. When the realm display name is set
             (slice 3) it shows above "Timesheets"; until then "Timesheets" stands alone. -->
        <div class="masthead">
            <#if (realm.displayName)?has_content>
                <p class="masthead-name">${realm.displayName}</p>
                <p class="masthead-product">${msg("productName")}</p>
            <#else>
                <p class="masthead-name">${msg("productName")}</p>
            </#if>
        </div>

        <article class="sheet">
            <h1 id="kc-page-title"><#nested "header"></h1>

            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <#if message.type == 'success' || message.type == 'info'>
                    <p class="notice notice-ok" role="status">
                        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                        <span>${kcSanitize(message.summary)?no_esc}</span>
                    </p>
                <#else>
                    <section class="notice notice-error" role="alert">
                        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                        <span>${kcSanitize(message.summary)?no_esc}</span>
                    </section>
                </#if>
            </#if>

            <#nested "form">

            <#if auth?has_content && auth.showTryAnotherWayLink()>
                <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                    <input type="hidden" name="tryAnotherWay" value="on">
                    <a href="#" id="try-another-way" class="link-button">${msg("doTryAnotherWay")}</a>
                </form>
            </#if>

            <#nested "socialProviders">

            <#if displayInfo>
                <div id="kc-info"><#nested "info"></div>
            </#if>
        </article>
    </main>
</div>
</body>
</html>
</#macro>
