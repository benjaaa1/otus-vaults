import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/react'

export const OtusModal = ({ title, isOpen, onClose, children }) => {
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{ title }</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
         { children }
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}