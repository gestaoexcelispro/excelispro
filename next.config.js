/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source:
          '/dashboard/projetos/lista',

        destination:
          '/dashboard/projects',

        permanent: false,
      },
      {
        source:
          '/dashboard/projetos/coleta',

        destination:
          '/dashboard/projects/setup',

        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
