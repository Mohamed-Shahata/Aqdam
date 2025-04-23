import { Box, Button, FormControl, FormLabel, Heading, Input, Select, Text, Link, useColorModeValue, useToast, SimpleGrid } from '@chakra-ui/react'
import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from "react-router-dom"
import Cookies from "js-cookie"
import api from "../api"

function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast()
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setIsLoading(true);
    try {
      const response = await api.post(`/auth/register`, {
        firstName, lastName, age, gender, email, password
      });

      if (response.status === 200) {
        Cookies.set("registerEmail", email, { expires: 1 })
        toast({
          title: "Account created successfully 🎉",
          description: "Please check your email inbox to verify your account.",
          status: "success",
          duration: 5000,
          isClosable: true
        });
        navigate("/verify-code")
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Something went wrong";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
    setIsLoading(false);
  }

  return (
    <Box
      maxW="600px"
      mx="auto"
      mt="100px"
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg={bg}
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Heading mb={6} textAlign="center">AQ</Heading>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>First Name</FormLabel>
            <Input
              type='text'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='Enter your first name please'
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Last Name</FormLabel>
            <Input
              type='text'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder='Enter your last name please'
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Age</FormLabel>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              placeholder='Enter your age please'
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Gender</FormLabel>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder='Select gender'
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email please'
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password please'
              required
            />
          </FormControl>
        </SimpleGrid>
        <Button
          colorScheme='teal'
          width="full"
          type="submit"
          isLoading={isLoading}
          mt={6}
        >
          Create Account
        </Button>
      </form>
      <Text mt={4} textAlign="center">
        Already have account?{' '}
        <Link as={RouterLink} to="/login" color="teal.500">Login</Link>
      </Text>
    </Box>
  )
}

export default Register