import next from 'eslint-config-next'

const config = [
  ...next,
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      '@next/next/no-img-element': 'warn',
      'import/no-anonymous-default-export': 'off',
    },
  },
]

export default config
