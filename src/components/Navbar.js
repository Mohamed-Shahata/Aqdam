import React, { useContext } from 'react'
import { Box, Button, Flex, Icon, Link, Spacer } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { AuthContext } from '../AuthContext'
import { FaHome, FaPlus, FaSignInAlt, FaSignOutAlt, FaUser, FaUserPlus } from 'react-icons/fa'
import ColorModeToggle from './ColorModeToggle'

function Navbar() {
  const { isAuthenticated, logout } = useContext(AuthContext)

  return (
    <Box bg="teal.500" p={4}>
      <Flex align="center" maxW="1200px" mx="auto">
        <Link as={RouterLink} to="/" color="white" fontSize="xl" fontWeight="bold">About As</Link>

        <Spacer />
        {isAuthenticated ? (
            <>
              <Button 
                as={RouterLink} 
                to="/home" 
                colorScheme='teal' 
                variant="ghost" 
                color="black" 
                mx={2}
                leftIcon={<Icon as={FaHome} />}
              >Home</Button>

              <Button 
                as={RouterLink} 
                to="/profile" 
                colorScheme='teal' 
                variant="ghost" 
                color="black" 
                mx={2}
                leftIcon={<Icon as={FaUser} />}
              >Profile</Button>

              <Button 
                as={RouterLink} 
                to="/create-post" 
                colorScheme='teal' 
                variant="ghost" 
                color="black" 
                mx={2}
                leftIcon={<Icon as={FaPlus} />}
              >Create Post</Button>

              <Button 
                onClick={logout} 
                colorScheme='red'
                variant="outline" 
                color="black" 
                mx={2}
                leftIcon={<Icon as={FaSignOutAlt} />}
              >Logout</Button>

              <ColorModeToggle />
            </>
          ): (
            <>
              <Button 
                as={RouterLink} 
                to="/login" 
                colorScheme='teal' 
                variant="ghost" 
                color="black" 
                mx={2}
                leftIcon={<Icon as={FaSignInAlt} />}
              >Login</Button>

              <Button 
                as={RouterLink} 
                to="/register" 
                colorScheme='teal' 
                variant="ghost" 
                color="black" 
                mx={2}
                leftIcon={<Icon as={FaUserPlus} />}
              >Register</Button>

              <ColorModeToggle />
            </>
        )}
      </Flex>
    </Box>
  )
}



export default Navbar
