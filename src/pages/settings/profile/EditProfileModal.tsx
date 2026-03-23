import React, { Dispatch, FC, SetStateAction } from 'react';
import Modal, { ModalBody } from '../../../components/bootstrap/Modal';
import EditProfile from './EditProfile';

interface EditProfileModalPropsInterface {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const EditProfileModal: FC<EditProfileModalPropsInterface> = ({ isOpen, setIsOpen }) => {
	return (
		<Modal
			setIsOpen={setIsOpen}
			isOpen={isOpen}
			titleId='editProfile'
			isCentered
			isScrollable
			size='xl'>
			<ModalBody>
				<EditProfile setIsOpen={setIsOpen} isOpen={isOpen} />
			</ModalBody>
			<></>
		</Modal>
	);
};

export default EditProfileModal;
