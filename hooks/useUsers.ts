import { useData } from '../contexts/DataContext';

export const useUsers = () => {
    const {
        users,
        loadingUsers: loading,
        errorUsers: error,
        refreshUsers: refresh,
        addUser,
        updateUser,
        deleteUser
    } = useData();

    return {
        users,
        addUser,
        deleteUser,
        updateUser,
        loading,
        error,
        refresh
    };
};
