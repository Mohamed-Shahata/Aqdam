import { extendTheme } from "@chakra-ui/react"


const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false
  },
  colors: {
    brand: {
      light: {
        bg: "#f7fafc",
        text: "#1a202c",
        teal: '#319795'
      },
      dark: {
        bg: "#1a202c",
        text: "#e2e8f0",
        teal: '#4fd1c5'
      }
    }
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'light' ? 'brand.light.bg' : 'brand.dark.bg',
        color: props.colorMode === 'light' ? 'brand.light.text' : 'brand.dark.text'
      }
    })
  }
});

export default theme;