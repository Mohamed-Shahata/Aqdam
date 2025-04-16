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
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';

const Search = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
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

  return (
    <Container maxW="container.md" py={8}>
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