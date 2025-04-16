import React, { useContext, useState } from 'react'
import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Icon, IconButton, Input, InputGroup, InputRightElement, Link, useColorModeValue, useDisclosure, VStack } from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { AuthContext } from '../AuthContext'
import { FaHome, FaList, FaSignInAlt, FaUser, FaUserPlus } from 'react-icons/fa'
import ColorModeToggle from './ColorModeToggle'
import { SearchIcon, SettingsIcon } from '@chakra-ui/icons'

function Navbar() {
  const { isAuthenticated } = useContext(AuthContext);
  const bg = useColorModeValue('white', 'gray.800');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const searchBg = useColorModeValue("gray.100", "gray.700");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <>
      <Box
        bg={bg}
        py={4}
        shadow="sm"
        position="sticky"
        top={0}
        zIndex={10}
        borderColor={borderColor}
        borderBottomWidth={1}
      >
        <Flex align="center" justify="space-between" maxW="container.xl" mx="auto" px={{ base: 4, md: 0 }}>
          <Link as={RouterLink} to="/home" fontSize="xl" fontWeight="bold" color="teal">
            Aqdem
          </Link>

          {isAuthenticated && (
            <Flex
              align="center"
              flex={1}
              maxW={{ base: '100%', md: '400px' }}
              mx={{ base: 0, md: 4 }}
              display={{ base: 'none', md: 'flex' }}
            >
              <InputGroup>
                <Input
                  placeholder="Search for people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  borderRadius="md"
                  size="md"
                  bg={searchBg}
                  _focus={{ borderColor: 'teal.500' }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label="Search"
                    icon={<SearchIcon />}
                    onClick={handleSearch}
                    variant="ghost"
                    size="sm"
                    colorScheme="teal"
                  />
                </InputRightElement>
              </InputGroup>
            </Flex>
          )}

          <Flex alignItems="center">
            <IconButton
              icon={<FaList />}
              aria-label="Open menu"
              display={{ base: 'flex', md: 'none' }}
              onClick={onDrawerOpen}
              variant="outline"
              mr={2}
            />
            <Flex alignItems="center" display={{ base: 'none', md: 'flex' }}>
              {isAuthenticated ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/home"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaHome} />}
                    mx={1}
                  >
                    Home
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/profile"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaUser} />}
                    mx={1}
                  >
                    Profile
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/settings"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={SettingsIcon} />}
                    mx={1}
                  >
                    Settings
                  </Button>
                  <ColorModeToggle />
                </>
              ) : (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaSignInAlt} />}
                    mx={1}
                  >
                    Login
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/register"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaUserPlus} />}
                    mx={1}
                  >
                    Register
                  </Button>
                  <ColorModeToggle />
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Box>

      <Drawer isOpen={isDrawerOpen} placement="right" onClose={onDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {isAuthenticated && (
                <InputGroup>
                  <Input
                    placeholder="Search for people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    borderRadius="md"
                    bg={searchBg}
                    _focus={{ borderColor: 'teal.500' }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Search"
                      icon={<SearchIcon />}
                      onClick={handleSearch}
                      variant="ghost"
                      size="sm"
                      colorScheme="teal"
                    />
                  </InputRightElement>
                </InputGroup>
              )}
              {isAuthenticated ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/home"
                    colorScheme="teal"
                    variant="ghost"
                    onClick={onDrawerClose}
                    leftIcon={<Icon as={FaHome} />}
                  >
                    Home
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/profile"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaUser} />}
                    onClick={onDrawerClose}
                  >
                    Profile
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/settings"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={SettingsIcon} />}
                    onClick={onDrawerClose}
                  >
                    Settings
                  </Button>
                  <ColorModeToggle />
                </>
              ) : (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaSignInAlt} />}
                    onClick={onDrawerClose}
                  >
                    Login
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/register"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaUserPlus} />}
                    onClick={onDrawerClose}
                  >
                    Register
                  </Button>
                  <ColorModeToggle />
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Navbar