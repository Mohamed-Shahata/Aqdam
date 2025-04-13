import { Box, Button, Container, FormControl, FormLabel, Heading, Image, Input, Textarea, useColorModeValue, VStack } from '@chakra-ui/react'
import React, { useState } from 'react'

function CreatePost() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if(file){
      const reader =new FileReader();
      reader.onloadend = ()=> {
        setImage(reader.result); //Base64 string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) =>{
    e.preventDefault();
    console.log("New Post: ", content);
    setContent("");
    setImage(null);
  };

  const bg = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Create Post</Heading>
      <Box bg={bg} p={6} borderRadius="md" boxShadow="sm">
        <VStack as="form" onSubmit={handleSubmit} spacing={4}>
          <FormControl>
            <FormLabel>Enter Post</FormLabel>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='What do you want share'
              rows={5}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Like image</FormLabel>
            <Input
              type="file"
              accept='image/*'
              onChange={handleImageChange}
              p={1}
            />
            {image && (
              <Image src={image} alt='Preview' mt={2} maxH="200px" objectFit="cover"/>
            )}
          </FormControl>
          <Button colorScheme='teal' type="submit" width="full">Shere</Button>
        </VStack>
      </Box>
    </Container>
  )
}

export default CreatePost
