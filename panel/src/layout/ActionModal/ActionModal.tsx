import {
    Dialog,
    DialogContent, DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useActionModalStateValue } from "@/hooks/actionModal";
import { InfoIcon, ListIcon, HistoryIcon, GavelIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import GenericSpinner from "@/components/GenericSpinner";
import { cn } from "@/lib/utils";
import { useBackendApi } from "@/hooks/fetch";
import ActionModalFooter from "./ActionModalFooter";
import ModalCentralMessage from "@/components/ModalCentralMessage";
import { HistoryActionModalResp, HistoryActionModalSuccess } from "@shared/historyApiTypes";


const modalTabs = [
    {
        title: 'Info',
        icon: <InfoIcon className="mr-2 h-5 w-5 hidden xs:block" />,
    },
    {
        title: 'History',
        icon: <HistoryIcon className="mr-2 h-5 w-5 hidden xs:block" />,
    },
    {
        title: 'IDs',
        icon: <ListIcon className="mr-2 h-5 w-5 hidden xs:block" />,
    },
    {
        title: 'Ban',
        icon: <GavelIcon className="mr-2 h-5 w-5 hidden xs:block" />,
        className: 'hover:bg-destructive hover:text-destructive-foreground',
    }
]


export default function ActionModal() {
    const { isModalOpen, closeModal, actionRef } = useActionModalStateValue();
    const [selectedTab, setSelectedTab] = useState(modalTabs[0].title);
    const [currRefreshKey, setCurrRefreshKey] = useState(0);
    const [modalData, setModalData] = useState<HistoryActionModalSuccess | undefined>(undefined);
    const [modalError, setModalError] = useState('');
    const historyGetActionApi = useBackendApi<HistoryActionModalResp>({
        method: 'GET',
        path: `/history/action`,
        abortOnUnmount: true,
    });

    //Helper for tabs to be able to refresh the modal data
    const refreshModalData = () => {
        setCurrRefreshKey(currRefreshKey + 1);
    };

    //Querying Action data when reference is available
    useEffect(() => {
        if (!actionRef) return;
        setModalData(undefined);
        setModalError('');
        historyGetActionApi({
            queryParams: { id: actionRef },
            success: (resp) => {
                if ('error' in resp) {
                    setModalError(resp.error);
                } else {
                    setModalData(resp);
                }
            },
            error: (error) => {
                setModalError(error);
            },
        });
    }, [actionRef, currRefreshKey]);

    //Resetting selected tab when modal is closed
    useEffect(() => {
        if (!isModalOpen) {
            setTimeout(() => {
                setSelectedTab(modalTabs[0].title);
            }, 200);
        }
    }, [isModalOpen]);

    const handleOpenClose = (newOpenState: boolean) => {
        if (isModalOpen && !newOpenState) {
            closeModal();
        }
    };

    let pageTitle: JSX.Element;
    if (modalData) {
        if (modalData.action.type === 'ban') {
            pageTitle = <>
                <span className="text-destructive-inline font-mono mr-2">[BAN]</span>
                {modalData.action.id}
            </>;
        } else if (modalData.action.type === 'warn') {
            pageTitle = <>
                <span className="text-warning-inline font-mono mr-2">[WARN]</span>
                {modalData.action.id}
            </>;

        } else {
            throw new Error(`Unknown action type: ${modalData.action.type}`);
        }
    } else if (modalError) {
        pageTitle = <span className="text-destructive-inline">Error!</span>;
    } else {
        pageTitle = <span className="text-muted-foreground italic">Loading...</span>;
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={handleOpenClose}>
            <DialogContent
                className="max-w-2xl h-full sm:h-auto max-h-full p-0 gap-1 sm:gap-4 flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="tracking-wide line-clamp-1 break-all mr-6">{pageTitle}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row md:px-4 h-full">
                    <div className="flex flex-row md:flex-col gap-1 bg-muted md:bg-transparent p-1 md:p-0 mx-2 md:mx-0 rounded-md">
                        {modalTabs.map((tab) => (
                            <Button
                                key={tab.title}
                                variant={selectedTab === tab.title ? "secondary" : "ghost"}
                                className={cn(
                                    'w-full tracking-wider justify-center md:justify-start',
                                    'h-7 rounded-sm px-2 text-sm',
                                    'md:h-10 md:text-base',
                                    tab.className,
                                )}
                                onClick={() => setSelectedTab(tab.title)}
                            >
                                {tab.icon} {tab.title}
                            </Button>
                        ))}
                    </div>
                    {/* NOTE: consistent height: sm:h-[16.5rem] */}
                    <ScrollArea className="w-full max-h-[calc(100vh-3.125rem-4rem-5rem)] min-h-[16.5rem] md:max-h-[50vh] px-4 py-2 md:py-0">
                        {!modalData ? (
                            <ModalCentralMessage>
                                {modalError ? (
                                    <span className="text-destructive-inline">Error: {modalError}</span>
                                ) : (
                                    <GenericSpinner msg="Loading..." />
                                )}
                            </ModalCentralMessage>
                        ) : (
                            <>
                                {/* {selectedTab === 'Info' && <InfoTab
                                    actionRef={actionRef!}
                                    player={modalData.player}
                                    setSelectedTab={setSelectedTab}
                                    refreshModalData={refreshModalData}
                                />}
                                {selectedTab === 'History' && <HistoryTab
                                    actionHistory={modalData.player.actionHistory}
                                    serverTime={modalData.serverTime}
                                    refreshModalData={refreshModalData}
                                />}
                                {selectedTab === 'IDs' && <IdsTab
                                    player={modalData.player}
                                />}
                                {selectedTab === 'Ban' && <BanTab
                                    actionRef={actionRef!}
                                />} */}
                            </>
                        )}
                    </ScrollArea>
                </div>
                <ActionModalFooter
                    actionRef={actionRef!}
                    action={modalData?.action}
                />
            </DialogContent>
        </Dialog>
    );
}