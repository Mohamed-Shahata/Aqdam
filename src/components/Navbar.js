import React, { useContext, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Link,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FaHome, FaList, FaSignInAlt, FaUser, FaUserPlus, FaUsers } from 'react-icons/fa';
import ColorModeToggle from './ColorModeToggle';
import { BellIcon, SettingsIcon } from '@chakra-ui/icons';
import api from '../api';

function Navbar() {
  const { isAuthenticated } = useContext(AuthContext);
  const bg = useColorModeValue('white', 'gray.800');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [notifications, setNotifications] = useState([]);
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Bell color based on unread notifications
  const bellColor = useColorModeValue(
    notifications.length > 0 && notifications.filter((n) => !n.isRead).length > 0 ? 'yellow.500' : 'gray.500',
    notifications.length > 0 && notifications.filter((n) => !n.isRead).length > 0 ? 'yellow.300' : 'gray.300'
  );

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (isAuthenticated) {
        try {
          const response = await api.get('/notifications');
          const fetchedNotifications = Array.isArray(response.data) ? response.data : [];
          setNotifications(fetchedNotifications);
        } catch (error) {
          console.error('Notifications Fetch Error:', error);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [isAuthenticated]);


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
        <Flex
          align="center"
          justify="space-between"
          maxW="container.md"
          mx="auto"
          px={{ base: 4, md: 0 }}
        >
          <Link fontFamily="heading" as={RouterLink} to="/home" fontSize="xl" fontWeight="bold" color="teal.500">
            AQ
          </Link>

          <Flex alignItems="center">
            {isAuthenticated && (
              <Button
                as={RouterLink}
                to="/notifications"
                variant="ghost"
                position="relative"
                display={{ base: 'flex', md: 'none' }}
                mr={2}
              >
                <BellIcon boxSize={6} color={bellColor} />
                {notifications.length > 0 && notifications.filter((n) => !n.isRead).length > 0 && (
                  <Box
                    position="absolute"
                    top={0}
                    right={0}
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    w={5}
                    h={5}
                    fontSize="sm"
                    fontWeight="bold"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {notifications.filter((n) => !n.isRead).length}
                  </Box>
                )}
              </Button>
            )}
            <IconButton
              icon={<FaList />}
              aria-label="Open menu"
              display={{ base: 'flex', md: 'none' }}
              onClick={onDrawerOpen}
              variant="outline"
              mr={2}
            />
            <Flex alignItems="center" display={{ base: 'none', md: 'flex' }}>
              {isAuthenticated && (
                <Button
                  as={RouterLink}
                  to="/users"
                  colorScheme="teal"
                  variant="ghost"
                  leftIcon={<Icon as={FaUsers} />}
                  mx={1}
                >
                  P
                </Button>
              )}
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
                    People
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
                  <Button as={RouterLink} to="/notifications" variant="ghost" position="relative" mx={1}>
                    <BellIcon boxSize={6} color={bellColor} />
                    {notifications.length > 0 && notifications.filter((n) => !n.isRead).length > 0 && (
                      <Box
                        position="absolute"
                        top={0}
                        right={0}
                        bg="red.500"
                        color="white"
                        borderRadius="full"
                        w={5}
                        h={5}
                        fontSize="sm"
                        fontWeight="bold"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {notifications.filter((n) => !n.isRead).length}
                      </Box>
                    )}
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
                <>

                  <Button
                    as={RouterLink}
                    to="/notifications"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<BellIcon color={bellColor} />}
                    onClick={onDrawerClose}
                    position="relative"
                  >
                    Notifications
                    {notifications.length > 0 && notifications.filter((n) => !n.isRead).length > 0 && (
                      <Box
                        position="absolute"
                        top={2}
                        right={2}
                        bg="red.500"
                        color="white"
                        borderRadius="full"
                        w={5}
                        h={5}
                        fontSize="sm"
                        fontWeight="bold"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {notifications.filter((n) => !n.isRead).length}
                      </Box>
                    )}
                  </Button>
                </>
              )}
              {isAuthenticated ? (
                <>
                  <Button
                    as={RouterLink}
                    to="/home"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaHome} />}
                    onClick={onDrawerClose}
                  >
                    Home
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/users"
                    colorScheme="teal"
                    variant="ghost"
                    leftIcon={<Icon as={FaUsers} />}
                    onClick={onDrawerClose}
                  >
                    People
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
  );
}

export default Navbar;