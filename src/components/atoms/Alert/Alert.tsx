import { Alert as ADAlert } from 'antd';
import { 
  LoadingOutlined, 
} from '@ant-design/icons';
import {
  FaCheck,
  FaCheckCircle,
  FaInfo,
  FaInfoCircle,
  FaTimes,
  FaTimesCircle
} from 'react-icons/fa';
import './Alert.less';
import { Row, Col } from 'components/atoms/Grid/Grid';

interface AlertValues {
  value: string,
  icon: string,
  txid?: string
}

interface AlertProps {
    visible: boolean,
    setVisible: any,
    title: any,
    description: Array<AlertValues>,
    type: "success" | "info" | "error" | "warning"
}

function Alert({
    visible,
    setVisible,
    title,
    description,
    type
  }: AlertProps) {

    const handleClose = () => {
      setVisible(false);
    };

    if (visible === true && type === 'success') {
      setTimeout(() => {
        setVisible(false);
      }, 10000);
    }

    return (
      <div>
        {visible ? (
          <ADAlert 
            message={
              type === 'success' ?
              <div style={{ display: 'flex', margin: '0rem 0rem 1rem' }}>
                  <FaCheckCircle style={{color: "#00FFE7", fontSize: '22px'}} /> 
                  <div style={{ marginLeft: '1rem', fontFamily: 'Inconsolata', fontWeight: '800', textTransform: 'uppercase', fontSize: '16px', color: 'white', letterSpacing: '0.12em' }}>{title}</div>
              </div>
              : type === 'info' ?
              <div style={{ display: 'flex', margin: '0rem 0rem 1rem' }}>
                  <LoadingOutlined 
                    style={{color: "#00FFE7", fontSize: '22px'}}
                  /> 
                  <div style={{ marginLeft: '1rem', fontFamily: 'Inconsolata', fontWeight: '800', textTransform: 'uppercase', fontSize: '16px', color: 'white', letterSpacing: '0.12em' }}>{title}</div>
              </div>
              : type === 'warning' ?
              <div style={{ display: 'flex', margin: '0rem 0rem 1rem' }}>
                  <FaInfoCircle style={{color: "#faad14", fontSize: '22px'}} /> 
                  <div style={{ marginLeft: '1rem', fontFamily: 'Inconsolata', fontWeight: '800', textTransform: 'uppercase', fontSize: '16px', color: 'white', letterSpacing: '0.12em' }}>{title}</div>
              </div>
              :
              <div style={{ display: 'flex', margin: '0rem 0rem 1rem' }}>
                  <FaTimesCircle style={{color: "#FD5200", fontSize: '22px'}} /> 
                  <div style={{ marginLeft: '1rem', fontFamily: 'Inconsolata', fontWeight: '800', textTransform: 'uppercase', fontSize: '16px', color: 'white', letterSpacing: '0.12em' }}>{title}</div>
              </div>
            } 
            description={
              <div>
                  {
                    description.map((x: AlertValues, index) => {
                      return (
                          <div style={{ display: 'flex', marginBottom: '0.5rem'}} key={index}>
                            {
                              x.icon === 'success' && 
                              <FaCheck style={{color: "#00FFE7", fontSize: '14px', marginLeft: '0.4rem', marginTop: '0.22rem'}} />
                            }
                            {
                              x.icon === 'info' && 
                              <FaInfo style={{color: "#faad14", fontSize: '14px', marginLeft: '0.4rem', marginTop: '0.22rem'}} /> 
                            }
                            {
                              x.icon === 'error' && 
                              <FaTimes style={{color: "#FD5200", fontSize: '14px', marginLeft: '0.4rem', marginTop: '0.22rem' }}/> 
                            }
                            {
                              x.icon === 'loading' && 
                              <LoadingOutlined 
                                style={{color: "#00FFE7", fontSize: '14px', marginLeft: '0.4rem', marginTop: '0.22rem'}}
                              /> 
                            }
                            {
                              x.txid 
                              ? 
                              <Row style={{ width: '100%' }}>
                                <Col span={18}>
                                  <div 
                                    style={{ 
                                      marginLeft: '1rem', 
                                      fontFamily: 'Open Sans', 
                                      fontWeight: '400',
                                      fontSize: '12px', 
                                      lineHeight: '21px',
                                      color: 'rgba(255, 255, 255, 0.5)', 
                                      overflowX: 'auto' 
                                    }}
                                  >
                                    {x.value}
                                  </div>
                                </Col>
                                <Col span={6} style={{ textAlign: 'right' }}>
                                  <a style={{ 
                                      fontFamily: 'Open Sans', 
                                      fontWeight: '400',
                                      fontSize: '12px', 
                                      lineHeight: '21px',
                                      color: 'rgba(255, 255, 255, 0.5)', 
                                      textDecoration: 'underline'
                                    }}  
                                    href={`https://solscan.io/tx/${x.txid}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    View
                                  </a>
                                </Col>
                              </Row> 
                              : 
                              <div 
                                style={{ 
                                  marginLeft: '1rem', 
                                  fontFamily: 'Open Sans', 
                                  fontWeight: '400',
                                  fontSize: '12px', 
                                  lineHeight: '21px',
                                  color: 'rgba(255, 255, 255, 0.5)', 
                                  overflowX: 'auto' 
                                }}
                              >
                                {x.value}
                              </div>
                            }
                        </div>
                      )
                    })
                  }
              </div>
            }
            type={type} 
            closable 
            afterClose={handleClose} 
          />
        ) : null}
      </div>
    );
}
  
export default Alert;