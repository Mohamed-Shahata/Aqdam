import {
  Box,
  Container,
  Heading,
  Text,
  Spinner,
  Flex,
  Avatar,
  useColorModeValue,
  useToast,
  UnorderedList,
  ListItem,
  Link,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch job details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id, toast]);

  // Helper function to convert string to list items
  const stringToList = (str) => {
    if (!str) return [];
    // Split by newlines or commas, and trim whitespace
    return str
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item);
  };

  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Flex justify="center" py={8}>
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Job not found.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Box
        p={5}
        borderWidth={1}
        borderRadius="md"
        boxShadow="sm"
        bg={bg}
        borderColor={borderColor}
      >
        {/* User Info */}
        <Flex align="center" mb={4}>
          <Avatar
            size="md"
            src={job.user?.profileImage}
            mr={3}
          />
          <Link
            as={RouterLink}
            to={`/profile/${job.user?.id}`}
            fontWeight="bold"
            color="teal.500"
            _hover={{ textDecoration: 'underline' }}
          >
            {job.user?.firstName} {job.user?.lastName}
          </Link>
        </Flex>

        {/* Job Details */}
        <Heading size="lg" mb={4}>
          {job.title}
        </Heading>

        {job.short_intro && (
          <Text color={textColor} mb={4}>
            {job.short_intro}
          </Text>
        )}

        <Text fontWeight="semibold" mb={2}>
          Responsibilities:
        </Text>
        <UnorderedList mb={4} color={textColor}>
          {stringToList(job.responsibilities).map((item, index) => (
            <ListItem key={index}>{item}</ListItem>
          ))}
        </UnorderedList>

        <Text fontWeight="semibold" mb={2}>
          Requirements:
        </Text>
        <UnorderedList mb={4} color={textColor}>
          {stringToList(job.requirements).map((item, index) => (
            <ListItem key={index}>{item}</ListItem>
          ))}
        </UnorderedList>

        {job.extra_info && (
          <>
            <Text fontWeight="semibold" mb={2}>
              Extra Info:
            </Text>
            <Text color={textColor} mb={4}>
              {job.extra_info}
            </Text>
          </>
        )}

        {/* Apply Button */}
        {job.email_applay && (
          <Button
            as="a"
            href={`mailto:${job.email_applay}?subject=Job Application - ${encodeURIComponent(job.title)}`}
            colorScheme="teal"
            size="lg"
            width={{ base: 'full', md: 'auto' }}
            borderRadius="md"
            mb={4}
          >
            Apply via Email
          </Button>
        )}

        <Text fontSize="sm" color="gray.500">
          Posted on: {new Date(job.createdAt).toLocaleDateString()}
        </Text>
      </Box>
    </Container>
  );
};

export default JobDetails;