import { createContext, useContext } from 'react'

/** Whether live order updates are connected (pages poll every 15 s when they aren't). */
export const AdminLiveContext = createContext(false)
export const useAdminLive = () => useContext(AdminLiveContext)
