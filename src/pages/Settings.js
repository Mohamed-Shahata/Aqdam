import React, { useState, useContext } from 'react';
import {
  Heading,
  VStack,
  Button,
  Container,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import api from '../api';

function Settings() {
  const { logout } = useContext(AuthContext);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { isOpen: isLogoutOpen, onOpen: onLogoutOpen, onClose: onLogoutClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');

  const handleLogout = () => {
    logout();
    onLogoutClose();
    toast({
      title: 'Logged Out',
      description: 'You have successfully logged out.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api.delete('/users');
      logout();
      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete account.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Settings</Heading>
      <VStack spacing={4} align="stretch" bg={bg} p={6} borderWidth={1} borderRadius="lg">
        <Button
          colorScheme="red"
          variant="outline"
          onClick={onLogoutOpen}
        >
          Log Out
        </Button>
        <Button
          colorScheme="red"
          onClick={onDeleteOpen}
        >
          Delete Account
        </Button>
      </VStack>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutOpen} onClose={onLogoutClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Log Out</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to log out?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={handleLogout}
            >
              Log Out
            </Button>
            <Button
              variant="ghost"
              onClick={onLogoutClose}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Account Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={handleDeleteAccount}
              isLoading={isDeletingAccount}
              loadingText="Deleting"
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              onClick={onDeleteClose}
              isDisabled={isDeletingAccount}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

export default Settings;