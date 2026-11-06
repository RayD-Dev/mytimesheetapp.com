export default {
  plugins: ['stylelint-value-no-unknown-custom-properties'],
  rules: {
    // Catches a var(--x) whose token was deleted or renamed. The build and the type check stay silent about it.
    'csstools/value-no-unknown-custom-properties': [true, { importFrom: ['src/assets/tokens.css'] }],
  },
}
