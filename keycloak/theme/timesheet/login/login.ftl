<#import "template.ftl" as layout>
<#-- Sign in. A wrong-password failure puts an error on both fields, so both go red and the
     alert above the form carries the words (R8-4). Empty and malformed input is caught in
     js/login.js before the form is sent; the server still has the last word. -->
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <#assign fieldsInvalid = messagesPerField.existsError('username', 'password')>
        <form id="kc-form-login" class="form" action="${url.loginAction}" method="post" novalidate
              data-email-required="${msg("emailRequired")}" data-email-invalid="${msg("emailInvalid")}"
              data-password-required="${msg("passwordRequired")}">
            <div class="field">
                <label for="username">${msg("usernameOrEmail")}</label>
                <input id="username" name="username" type="email" autocomplete="username"
                       value="${(login.username!'')}" autofocus
                       aria-invalid="${fieldsInvalid?c}"
                       aria-describedby="username-error">
                <p id="username-error" class="field-error" hidden></p>
            </div>

            <div class="field">
                <label for="password">${msg("password")}</label>
                <div class="password-wrap">
                    <input id="password" name="password" type="password" autocomplete="current-password"
                           aria-invalid="${fieldsInvalid?c}"
                           aria-describedby="password-error">
                    <button type="button" id="password-toggle" class="icon-button"
                            aria-label="${msg("showPassword")}"
                            data-show-label="${msg("showPassword")}" data-hide-label="${msg("hidePassword")}">
                        <svg class="icon eye-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                        <svg class="icon eye-off" viewBox="0 0 24 24" aria-hidden="true" hidden><path d="M10.7 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/></svg>
                    </button>
                </div>
                <p id="password-error" class="field-error" hidden></p>
            </div>

            <input type="hidden" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>>
            <button type="submit" id="kc-login" name="login" class="button button-primary">${msg("doLogIn")}</button>
        </form>

        <#if realm.resetPasswordAllowed>
            <a class="link-button" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
        </#if>
    </#if>
</@layout.registrationLayout>
