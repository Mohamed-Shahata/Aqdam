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
  Input,
  InputGroup,
  InputRightElement,
  Link,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FaHome, FaList, FaSignInAlt, FaUser, FaUserPlus } from 'react-icons/fa';
import ColorModeToggle from './ColorModeToggle';
import { BellIcon, SearchIcon, SettingsIcon } from '@chakra-ui/icons';
import api from '../api';

function Navbar() {
  const { isAuthenticated } = useContext(AuthContext);
  const bg = useColorModeValue('white', 'gray.800');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const searchBg = useColorModeValue('gray.100', 'gray.700');
  const navigate = useNavigate();
  const location = useLocation();

  // Bell color based on unread notifications
  const bellColor = useColorModeValue(
    notifications.filter((n) => !n.isRead).length > 0 ? 'yellow.500' : 'gray.500',
    notifications.filter((n) => !n.isRead).length > 0 ? 'yellow.300' : 'gray.300'
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
  }, [isAuthenticated, location.pathname]); // Refetch when location changes

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
          <Link as={RouterLink} to="/home" fontSize="xl" fontWeight="bold" color="teal.500">
            Aqdem
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
                {notifications.filter((n) => !n.isRead).length > 0 && (
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
                  <Button as={RouterLink} to="/notifications" variant="ghost" position="relative">
                    <BellIcon boxSize={6} color={bellColor} />
                    {notifications.filter((n) => !n.isRead).length > 0 && (
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
                    {notifications.filter((n) => !n.isRead).length > 0 && (
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