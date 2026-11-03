<#import "template.ftl" as layout>
<#-- Generic info page. After Sign out Keycloak shows this page with the logged-out message,
     so that one case is dressed as the Sign in page with its "You've signed out." line. -->
<@layout.registrationLayout displayMessage=false; section>
    <#assign signedOut = (message.summary == msg("loggedOutMessage"))>
    <#if section = "header">
        <#if signedOut>${msg("loginAccountTitle")}<#elseif messageHeader??>${messageHeader}<#else>${message.summary}</#if>
    <#elseif section = "form">
        <#if signedOut>
            <p class="notice notice-ok" role="status">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span>${kcSanitize(message.summary)?no_esc}</span>
            </p>
        <#else>
            <p class="instruction">${kcSanitize(message.summary)?no_esc}<#if requiredActions??><#list requiredActions>: <b><#items as reqActionItem>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}<#sep>, </#items></b></#list></#if></p>
        </#if>
        <#if skipLink??>
        <#elseif pageRedirectUri?has_content>
            <a class="button button-primary" href="${pageRedirectUri}">${msg(signedOut?then("doLogIn", "backToApplication"))}</a>
        <#elseif actionUri?has_content>
            <a class="button button-primary" href="${actionUri}">${msg("proceedWithAction")}</a>
        <#elseif (client.baseUrl)?has_content>
            <a class="button button-primary" href="${client.baseUrl}">${msg(signedOut?then("doLogIn", "backToApplication"))}</a>
        </#if>
    </#if>
</@layout.registrationLayout>
