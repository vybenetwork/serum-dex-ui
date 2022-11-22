import React, { useState } from 'react';
import Button from 'components/atoms/Button/Button';
import { Modal as ADModal } from 'antd';
import './Modal.less';

interface ModalProps {
    buttonType: 'primary' | 'default' | 'dashed' | 'text' | 'link';
    buttonChildren: React.ReactNode;
    buttonStyle?: object;
    buttonSize?: 'large' | 'small';
    title?: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    visible: boolean;
    setVisible: any;
    onModalOpen?: () => void;
}

function Modal({
    buttonType,
    buttonChildren,
    buttonStyle,
    buttonSize,
    title,
    footer,
    children,
    className,
    visible,
    setVisible,
    onModalOpen,
}: ModalProps) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showModal = () => {
        setVisible(true);
        if (onModalOpen) {
            onModalOpen();
        }
    };

    const handleOk = () => {
        setVisible(false);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    return (
        <>
            <Button
                size={buttonSize && buttonSize}
                style={buttonStyle && buttonStyle}
                type={buttonType}
                onClick={showModal}
            >
                {buttonChildren}
            </Button>
            <ADModal
                className={className && className}
                title={title && title}
                visible={visible}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={footer && footer}
                closable={false}
                destroyOnClose={true}
            >
                {children}
            </ADModal>
        </>
    );
}

export default Modal;
