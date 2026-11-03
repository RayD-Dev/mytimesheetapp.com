// Show/hide password and the checks that run when the person presses Sign in (R8-4).
// The server validates again, so skipping this script never lets a bad request through.
(function () {
  'use strict'

  function setFieldError(input, message) {
    var note = document.getElementById(input.id + '-error')
    input.setAttribute('aria-invalid', message ? 'true' : 'false')
    if (!note) return
    note.textContent = message
    note.hidden = !message
  }

  function initPasswordToggle() {
    var button = document.getElementById('password-toggle')
    var input = document.getElementById('password')
    if (!button || !input) return
    button.addEventListener('click', function () {
      var showing = input.type === 'text'
      input.type = showing ? 'password' : 'text'
      button.setAttribute('aria-label', showing ? button.dataset.showLabel : button.dataset.hideLabel)
      button.querySelector('.eye-on').hidden = !showing
      button.querySelector('.eye-off').hidden = showing
    })
  }

  function initSignInChecks() {
    var form = document.getElementById('kc-form-login')
    if (!form) return
    var email = document.getElementById('username')
    var password = document.getElementById('password')

    function emailProblem(value) {
      if (!value) return form.dataset.emailRequired
      if (!/^\S+@\S+\.\S+$/.test(value)) return form.dataset.emailInvalid
      return ''
    }

    form.addEventListener('submit', function (event) {
      var emailMessage = emailProblem(email.value.trim())
      var passwordMessage = password.value ? '' : form.dataset.passwordRequired
      setFieldError(email, emailMessage)
      setFieldError(password, passwordMessage)
      if (!emailMessage && !passwordMessage) return
      event.preventDefault()
      ;(emailMessage ? email : password).focus()
    })
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggle()
    initSignInChecks()
  })
})()
