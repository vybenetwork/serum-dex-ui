import ButtonGroup from 'components/molecules/ButtonGroup/ButtonGroup';
import './MobileFooter.less';

interface ButtonGroupValues {
    value: string,
    label: string
}

interface MobileFooterProps {
    values: Array<ButtonGroupValues>,
    selected: string,
    setSelected: any
}

function MobileFooter({
    values,
    selected,
    setSelected
  }: MobileFooterProps) {
    return (
        <div 
            style={{ 
                position: 'fixed', 
                bottom: "0", 
                left: '0',
                height: "48px", 
                width: "100%",
                textAlign: "center"
            }}
            className='mobile_footer__button_group_wrapper'
        >
            <ButtonGroup
                values={values}
                selected={selected}
                setSelected={setSelected}
            />
        </div>
    );
}

export default MobileFooter;