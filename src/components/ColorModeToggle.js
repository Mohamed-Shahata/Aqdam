import { IconButton, useColorMode } from '@chakra-ui/react'
import React from 'react'
import { FaMoon, FaSun } from 'react-icons/fa';

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton 
      aria-label='Toggle color mode'
      icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
      onClick={toggleColorMode}
      colorScheme='teal'
      variant="ghost"
      color={colorMode === 'light' ? 'brand.light.text' : 'brand.dark.text'}
    />
  )
}

export default ColorModeToggle
