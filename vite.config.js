import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({

  server:{

    https: {

      key: 'doctorship-privateKey.key',
      cert: 'doctorship.crt',

    }

  },
  plugins: [react()],
})
