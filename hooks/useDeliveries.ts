import { useData } from '../contexts/DataContext';

export const useDeliveries = () => {
    const {
        deliveries,
        loadingDeliveries: loading,
        errorDeliveries: error,
        refreshDeliveries: refresh,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        getDeliveriesByCourier,
        clearDeliveries
    } = useData();

    return {
        deliveries,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        getDeliveriesByCourier,
        clearDeliveries,
        refresh,
        loading,
        error
    };
};
