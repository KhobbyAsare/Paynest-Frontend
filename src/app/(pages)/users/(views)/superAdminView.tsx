"use client"

import React, { useEffect, useState } from 'react';
import { Table, Input, Tag, Space, Typography, Avatar, Card, message, Button } from 'antd';
import { SearchOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAllUsers } from '@/(api-handlers)/userHandler';
import { UserResponse } from '@/interfaces/loginInterface';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function SuperAdminPage() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<UserResponse[]>([]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (error: any) {
            message.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase()) ||
            user.username.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchText, users]);

    const columns: ColumnsType<UserResponse> = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.profile_pic}
                        icon={!record.profile_pic && <UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                    />
                    <Space direction="vertical" size={0}>
                        <Text strong>{`${record.first_name} ${record.last_name}`}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>@{record.username}</Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                let color = 'blue';
                if (role === 'superadmin') color = 'gold';
                if (role === 'admin') color = 'cyan';
                if (role === 'manager') color = 'purple';
                return (
                    <Tag color={color} style={{ textTransform: 'capitalize' }}>
                        {role}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Tag color={record.is_active ? 'green' : 'red'}>
                    {record.is_active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" size="small">Edit</Button>
                    <Button type="link" danger size="small">Delete</Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>User Management</Title>
                    <Text type="secondary">Manage and monitor all platform users in one place.</Text>
                </div>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchUsers}
                    loading={loading}
                >
                    Refresh
                </Button>
            </div>

            <Card styles={{ body: { padding: '0' } }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <Input
                        placeholder="Search users by name, email or username..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ maxWidth: '400px' }}
                        allowClear
                    />
                </div>
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} users`,
                    }}
                />
            </Card>
        </div>
    );
}