import React, { useState } from 'react'
import { useNavigate } from "react-router-dom"
import { Box, Button, FormControl, FormLabel, Heading, Input, Text, useColorModeValue, useToast } from "@chakra-ui/react"
import Cookies from "js-cookie"
import axios from "axios"

function VerifyCode() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const toast = useToast()
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handlerSubmit = async (e) => {
    e.preventDefault();
    const email = Cookies.get('registerEmail')
    if (!email) {
      toast({
        title: "Error",
        description: "No email found. Please try again or register first.",
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      navigate("/register")
      return;
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_DOMAIN}/api/auth/verify-code`, {
        email, code
      });

      if (response.status === 201) {
        toast({
          title: "Verification successful 🎉",
          description: "Your email has been verified. Please log in to your account.",
          status: "success",
          duration: 5000,
          isClosable: true
        });
        Cookies.remove("registerEmail")
        navigate("/login")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  }


  return (
    <Box
      maxW="400px"
      mx="auto"
      mt="100px"
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
      bg={bg}
      borderColor={borderColor}
    >
      <Heading mb={6} textAlign="center">Checking Code</Heading>
      <Text mb={4} textAlign="center">Enter Your Code Please</Text>

      <form onSubmit={handlerSubmit}>
        <FormControl mb={6}>
          <FormLabel>Code</FormLabel>
          <Input
            type='text'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder='Enter your code'
            required
          />
        </FormControl>
        <Button colorScheme='teal' width="full" type="submit">Proccess</Button>
      </form>
    </Box>
  )
}

export default VerifyCode
