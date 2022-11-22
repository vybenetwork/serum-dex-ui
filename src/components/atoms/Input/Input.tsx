import { Input as ADInput } from 'antd';
import './Input.css';

interface InputProps {
    value?: any,
    placeholder?: string,
    className?: string,
    prefix?: any,
    suffix?: any,
    style?: object,
    size?: 'large' | 'small',
    onChange?: any,
    disabled?: any,
}

function Input({
    value,
    placeholder,
    className,
    style,
    size,
    prefix,
    suffix,
    disabled,
    onChange
  }: InputProps) {
    return (
      <ADInput 
        value={value && value}
        placeholder={placeholder} 
        className={className && className}
        style={style && style}
        size={size && size}
        prefix={prefix && prefix}
        suffix={suffix && suffix}
        onChange={onChange && onChange}
        disabled={disabled && disabled}
      />
    );
}
  
export default Input;