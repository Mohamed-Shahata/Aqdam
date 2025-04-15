import React, { useContext } from 'react'
import { Box, Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerOverlay, Flex, Icon, IconButton, Link, useColorModeValue, useDisclosure, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AuthContext } from '../AuthContext'
import { FaHome, FaList, FaSignInAlt, FaUser, FaUserPlus } from 'react-icons/fa'
import ColorModeToggle from './ColorModeToggle'
import { SettingsIcon } from '@chakra-ui/icons'

function Navbar() {
  const { isAuthenticated } = useContext(AuthContext);
  const bg = useColorModeValue('white', 'gray.800');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

  return (
    <>
      <Box
        bg={bg}
        px={4}
        py={3}
        shadow="sm"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Link as={RouterLink} to="/home" color="white" fontSize="xl" fontWeight="bold">Aqdem</Link>

          <Flex alignItems="center">
            <IconButton
              icon={<FaList />}
              aria-label='Open menu'
              display={{ base: "flex", md: "none" }}
              onClick={onDrawerOpen}
              variant="outline"
              mr={2}
            />
          </Flex>

          <Flex alignItems="center" display={{ base: "none", md: "flex" }}>
            {isAuthenticated ? (
              <>
                <Button
                  as={RouterLink}
                  to="/home"
                  colorScheme='teal'
                  variant="ghost"

                  leftIcon={<Icon as={FaHome} />}
                >Home</Button>

                <Button
                  as={RouterLink}
                  to="/profile"
                  colorScheme='teal'
                  variant="ghost"

                  leftIcon={<Icon as={FaUser} />}
                >Profile</Button>

                <Button
                  as={RouterLink}
                  to="/settings"
                  colorScheme='teal'
                  variant="ghost"
                  leftIcon={<Icon as={SettingsIcon} />}
                >Settings</Button>

                <ColorModeToggle />
              </>
            ) : (
              <>
                <Button
                  as={RouterLink}
                  to="/login"
                  colorScheme='teal'
                  variant="ghost"

                  leftIcon={<Icon as={FaSignInAlt} />}
                >Login</Button>

                <Button
                  as={RouterLink}
                  to="/register"
                  colorScheme='teal'
                  variant="ghost"

                  leftIcon={<Icon as={FaUserPlus} />}
                >Register</Button>

                <ColorModeToggle />
              </>
            )}
          </Flex>
        </Flex>
      </Box>

      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        onClose={onDrawerClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Lists</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {isAuthenticated ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/home"
                    colorScheme='teal'
                    variant="ghost"
                    onClick={onDrawerClose}
                    leftIcon={<Icon as={FaHome} />}
                  >Home</Button>

                  <Button
                    as={RouterLink}
                    to="/profile"
                    colorScheme='teal'
                    variant="ghost"
                    leftIcon={<Icon as={FaUser} />}
                    onClick={onDrawerClose}
                  >Profile</Button>

                  <Button
                    as={RouterLink}
                    to="/settings"
                    colorScheme='teal'
                    variant="ghost"
                    leftIcon={<Icon as={SettingsIcon} />}
                  >Settings</Button>

                  <ColorModeToggle />
                </>
              ) : (
                <>
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme='teal'
                    variant="ghost"
                    leftIcon={<Icon as={FaSignInAlt} />}
                    onClick={onDrawerClose}
                  >Login</Button>

                  <Button
                    as={RouterLink}
                    to="/register"
                    colorScheme='teal'
                    variant="ghost"
                    leftIcon={<Icon as={FaUserPlus} />}
                    onClick={onDrawerClose}
                  >Register</Button>

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
