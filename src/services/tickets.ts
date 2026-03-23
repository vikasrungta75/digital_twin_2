import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';


export const useGetTicketsData = () => {
    const dispatch = useDispatch();

    return useQuery({
        queryKey: ['getTicketsData'],
        retryOnMount: true,
        queryFn: () => dispatch.tickets.getTicketsAsync(),
    });
};

export const useDeleteTicket = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ticket_id: string) =>
            dispatch.tickets.deleteTicket({
                ticket_id,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries(['getTicketsData']);
        },
        onError: (er) => {
          
        },
        mutationKey: ['deleteTicket'],
    })

}

export const useAddTicket = () => {
    const queryClient = useQueryClient()
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: (payload: any) => dispatch.tickets.addTicket({
            ...payload,
            action: 'Add ticket',
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['getTicketsData']);
        },
        onError: (er: any) => {
            
        },
        mutationKey: ['addTicket'],

    })
}

export const useUpdateTicket = () => {
    const queryClient = useQueryClient()
    const dispatch = useDispatch();
    return useMutation({
        mutationFn: (payload: any) => dispatch.tickets.updateTicket({
            ...payload,            
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['getTicketsData']);
        },
        onError: (er: any) => {
         
        },
        mutationKey: ['updateTicket'],

    })
}
