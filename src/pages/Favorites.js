import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Link,
  Button,
  UnorderedList,
  ListItem,
  Center,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { HamburgerIcon } from '@chakra-ui/icons';
import React, { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { AuthContext } from '../AuthContext';

const Favorites = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const queryClient = useQueryClient();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch favorite jobs with caching
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const response = await api.post('/jobs/favorites/me');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Mutation for removing favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: async (jobId) => {
      await api.delete(`/jobs/favorites/${jobId}`);
    },
    onSuccess: (_, jobId) => {
      // Update the cache manually
      queryClient.setQueryData(['favorites', user?.id], (old) => {
        if (!old) return [];
        return old.filter((job) => Number(job.id) !== Number(jobId));
      });
      toast({
        title: 'Success',
        description: 'Removed from favorites.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove from favorites.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Helper function to convert string to list items
  const stringToList = (str) => {
    if (!str) return [];
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleRemoveFavorite = (jobId) => {
    removeFavoriteMutation.mutate(jobId);
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Please log in to view your favorite jobs.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Heading size="lg" mb={6}>
        My Favorite Jobs
      </Heading>
      {favorites.length === 0 ? (
        <Text textAlign="center">No favorite jobs yet.</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {favorites.map((job) => (
            <Box
              key={`favorite-job-${job.id}`}
              p={8}
              minHeight="240px"
              borderWidth={1}
              borderRadius="md"
              boxShadow="sm"
              bg={bg}
              borderColor={borderColor}
              position="relative"
            >
              {/* Menu for actions */}
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<HamburgerIcon />}
                  variant="ghost"
                  size="sm"
                  position="absolute"
                  top={4}
                  right={4}
                  aria-label="Job options"
                />
                <MenuList>
                  <MenuItem onClick={() => handleRemoveFavorite(job.id)}>
                    Remove from Favorites
                  </MenuItem>
                </MenuList>
              </Menu>

              {/* User Info */}
              <Flex align="center" mb={6}>
                <Avatar size="md" src={job.user?.profileImage || ''} mr={3} />
                <Box>
                  <Link
                    as={RouterLink}
                    to={`/profile/${job.user?.id || ''}`}
                    fontWeight="bold"
                    color="teal.500"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {job.user?.firstName || 'Unknown'} {job.user?.lastName || ''}
                  </Link>
                </Box>
              </Flex>

              {/* Job Details */}
              <Heading
                size="md"
                mb={4}
                as={RouterLink}
                to={`/jobs/${job.id}`}
                color="teal.500"
                _hover={{ textDecoration: 'underline' }}
              >
                {job.title || 'Untitled Job'}
              </Heading>

              {job.short_intro && (
                <Text color={textColor} mb={4}>
                  {truncateText(job.short_intro, 100)}
                </Text>
              )}

              {job.responsibilities && (
                <>
                  <Text fontWeight="semibold" mb={2}>
                    Responsibilities:
                  </Text>
                  <UnorderedList mb={4} color={textColor}>
                    {stringToList(job.responsibilities)
                      .slice(0, 2)
                      .map((item, index) => (
                        <ListItem key={index}>{item}</ListItem>
                      ))}
                    {stringToList(job.responsibilities).length > 2 && (
                      <Text as="span" color={textColor} fontSize="sm">
                        ...
                      </Text>
                    )}
                  </UnorderedList>
                </>
              )}

              {/* Apply Button */}
              {job.email_applay && (
                <Button
                  as="a"
                  href={`mailto:${job.email_applay}?subject=Job Application - ${encodeURIComponent(job.title || 'Untitled Job')}`}
                  colorScheme="teal"
                  size="lg"
                  width={{ base: 'full', md: 'auto' }}
                  borderRadius="md"
                  mt={2}
                  mb={4}
                >
                  Apply via Email
                </Button>
              )}

              <Text fontSize="sm" color="gray.500">
                Posted on: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown'}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </Container>
  );
};

export default Favorites;