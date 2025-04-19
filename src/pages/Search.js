import {
  Box,
  Container,
  VStack,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  Icon,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';
import { IoSparkles } from 'react-icons/io5';
import { FaGem, FaCrown } from 'react-icons/fa';
import { SearchIcon } from '@chakra-ui/icons';

const Search = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const searchBg = useColorModeValue('gray.100', 'gray.700');
  const location = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams(location.search).get('query');
        if (!query) {
          setUsers([]);
          setIsLoading(false);
          return;
        }
        const response = await api.get(`/users?search=${encodeURIComponent(query)}`);
        setUsers(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch users.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [location.search, toast]);

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
    <Container maxW="container.md" py={8}>
      <Flex
        justify="center"
        align="center"
        w="100%"
        py={2}
      >
        <Flex
          flex={1}
          maxW="600px"
          w="100%"
          align="center"
          mt={-3}
          mb={5}
        >
          <InputGroup w="100%">
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
      </Flex>
      {isLoading ? (
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      ) : users.length === 0 ? (
        <Text>No users found.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {users.filter(user => user.id !== currentUser.id).length === 0 ? (
            <Text textAlign="center" color="gray.500" mt={4}>
              No users found.
            </Text>
          ) : (
            users
              .filter(user => user.id !== currentUser.id)
              .map((user) => (
                <Box
                  key={user.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  boxShadow="sm"
                  bg={bg}
                  borderColor={borderColor}
                  as={RouterLink}
                  to={`/profile/${user.id}`}
                  display="flex"
                >
                  <Flex align="center">
                    <Avatar size="md" src={user.profileImage} mr={4} />
                    <Box>
                      <Text fontWeight="bold">
                        {user.firstName} {user.lastName}
                        {user.point >= 100 && (
                          <Icon
                            as={
                              user.point >= 10000
                                ? FaCrown
                                : user.point >= 1000
                                  ? FaGem
                                  : IoSparkles
                            }
                            ml={2}
                            mb={-1}
                            color={
                              user.point >= 10000
                                ? 'yellow.500'
                                : user.point >= 1000
                                  ? 'purple.400'
                                  : "blue.500"
                            }

                            boxSize={user.point >= 10000 ? 4 : user.point >= 1000 ? 4 : 4}
                            transition="color 0.2s"
                            aria-label={
                              user.point >= 10000
                                ? 'Elite Badge'
                                : user.point >= 1000
                                  ? 'Pro Badge'
                                  : 'Verified Badge'
                            }
                          />
                        )}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {user.bio || 'No bio available'}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ))
          )}

        </VStack>
      )}
    </Container>
  );
};

export default Search;