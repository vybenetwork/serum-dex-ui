import { Table as ADTable } from 'antd';
import './Table.css';

interface ColumnValues {
    title: string,
    dataIndex: string,
    key: string,
}

interface TableProps {
    columns: Array<ColumnValues>,
    data: any,
}

function Table({
    columns,
    data
  }: TableProps) {

    return (
        <ADTable dataSource={data} columns={columns} pagination={false} tableLayout="fixed"/>
    );
}
  
export default Table;