import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PluginClient } from "@remixproject/plugin";
import React, { createRef } from "react";

import { Alert, Card } from "react-bootstrap";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";

import { gitservice, useLocalStorage } from "../../App";
import ConfirmDelete from "../ConfirmDelete";
import { useBehaviorSubject } from "../usesubscribe";
import { GitHubSettings } from "./settings";

interface importerProps {
    client: PluginClient
 }

export const GitHubImporter: React.FC<importerProps> = (props) => {

    const [currentRemote, setCurrentRemote] = useLocalStorage(
        "CURRENT_REMOTE",
        'origin'
    );
    const [cloneUrl, setCloneUrl] = useLocalStorage(
        "CLONE_URL",
        ''
    );

    const [cloneDepth, setCloneDepth] = useLocalStorage(
        "CLONE_DEPTH",
        1
    );

    const [cloneBranch, setCloneBranch] = useLocalStorage(
        "CLONE_BRANCH",
        ''
    );

    const [url, setUrl] = useLocalStorage(
        "GITHUB_URL",
        ''
    );

    const branch = useBehaviorSubject(gitservice.branch);

    // const [branch, setBranch] = useLocalStorage(
    //     "GITHUB_BRANCH",
    //     'main'
    // );
    const [remoteBranch, setRemoteBranch] = useLocalStorage(
        "GITHUB_REMOTE_BRANCH",
        'main'
    );

    const [force, setForce] = useLocalStorage(
        "GITHUB_FORCE",
        false
    );

    const [cloneAllBranches, setcloneAllBranches] = useLocalStorage(
        "GITHUB_CLONE_ALL_BRANCES",
        false
    );

    const [remoteName, setRemoteName] = useLocalStorage(
        "GITHUB_REMOTE_NAME",
        ''
    );


    const remotes = useBehaviorSubject(gitservice.remotes);


    let ModalRef = createRef<ConfirmDelete>();

    const clone = async () => {
        try {
            await ModalRef.current?.show();
            setTimeout(() => gitservice.clone(cloneUrl, cloneBranch, cloneDepth, !cloneAllBranches), 1500)
        } catch (e) {

        }
    }

    const addRemote = async () => {
        await gitservice.addRemote(remoteName, url)
        setCurrentRemote(remoteName)
        await gitservice.getRemotes()
    }

    const delRemote = async (name: string) => {
        await gitservice.delRemote(name)
        await gitservice.getRemotes()
    }

    const push = async () => {
        gitservice.push(currentRemote, branch || '', remoteBranch, force)
    }

    const pull = async () => {
        gitservice.pull(currentRemote, branch || '', remoteBranch)
    }

    const fetch = async () => {
        gitservice.fetch(currentRemote, '', '')
    }

    const onUrlChange = (value: string) => {
        setUrl(value)
    }
    const onCloneUrlChange = (value: string) => {
        setCloneUrl(value)
    }
    const onCloneBranchChange = (value: string) => {
        setCloneBranch(value)
    }

    const onRemoteBranchChange = (value: string) => {
        setRemoteBranch(value)
    }

    const onAllBranchChange = (event: any) => {
        const target = event.target;
        const value = target.checked;
        setcloneAllBranches(value)
    }
    const onForceChange = (event: any) => {
        const target = event.target;
        const value = target.checked;
        setForce(value)
    }

    const onRemoteNameChange = (value: string) => {
        setRemoteName(value)
    }

    const onDepthChange = (value: number) => {
        setCloneDepth(value)
    }

    const remoteChange = (name: string) => {
        setCurrentRemote(name)
    }
    const showSettingsWarning = () => {
        return <GitHubSettings showOk={false} client={props.client} />
    }

    const cloneSection = () => {
        return <>
                    <h4>CLONE</h4>
            <div className='row'>
                <div className='col col-md-6 col-12'>
                    <label>URL</label>
                    <input name='cloneurl' onChange={e => onCloneUrlChange(e.target.value)} value={cloneUrl} className="form-control" type="text" id="cloneurl" />
                </div>
                <div className='col col-md-6 col-12'>
                <label>BRANCH</label>
                    <input name='clonebranch' onChange={e => onCloneBranchChange(e.target.value)} value={cloneBranch} className="form-control" type="text" id="clonebranch" />
                </div>
                <div className='col col-md-6 col-12'>
                    <label>DEPTH ( less saves space )</label>
                    <input name='clonedepth' onChange={e => onDepthChange(parseInt(e.target.value))} value={cloneDepth} className="form-control" type="number" id="clonedepth" />
                </div>

            </div>
            <div className='row'>
                <div className='col col-md-6 col-12'>
                    <label>CLONE ALL BRANCHES?</label><br></br>
                    <input name='clonallbranches' onChange={e => onAllBranchChange(e)} checked={cloneAllBranches} className="" type="checkbox" id="clonallbranches" />
                </div>
            </div>
            <button data-id='clonebtn' className='btn btn-primary m-2' onClick={async () => {
                clone()
            }}>clone</button>
            <hr></hr>
        </>
    }

    return (
        <>
            <ConfirmDelete
                title={"Cloning"}
                text={"This will create a new workspace! Your repo might be to big and crash the browser! Continue?"}
                ref={ModalRef}
            ></ConfirmDelete>
            <hr></hr>
            {showSettingsWarning()}
            {cloneSection()}

            <h4>commands</h4>
            <div className='row'>
                <div className='col col-md-6 col-12'>
                    <label>LOCAL BRANCH</label>
                    <input name='localbranch' readOnly value={branch} className="form-control" type="text" id="localbranch" />
                </div>
                <div className='col col-md-6 col-12'>
                    <label>REMOTE BRANCH</label>
                    <input name ='remotebranch' onChange={e => onRemoteBranchChange(e.target.value)} value={remoteBranch} className="form-control" type="text" id="remotebranch" />
                </div></div>
            <button className='btn btn-primary m-1' onClick={async () => {
                await gitservice.init()
            }}>init</button>
            <button className='btn btn-primary m-1' onClick={async () => {
                push()
            }}>push</button>
            <button className='btn btn-primary m-1' onClick={async () => {
                pull()
            }}>pull</button>
            <button className='btn btn-primary m-1' onClick={async () => {
                fetch()
            }}>fetch</button><br></br>
            <label>FORCE PUSH</label>
            <input name='force' className='ml-2' checked={force} onChange={e => onForceChange(e)} type="checkbox" id="forecepush" />
            <hr></hr>
            <h4>GIT REMOTE</h4>
            <div className='row'>
                <div className='col col-md-6 col-12'>
                    <label>NAME</label>
                    <input name='remotename' onChange={e => onRemoteNameChange(e.target.value)} value={remoteName} className="form-control" type="text" id="remotename" />
                </div>
                <div className='col col-md-6 col-12'>
                    <label>URL</label>
                    <input name='remoteurl' onChange={e => onUrlChange(e.target.value)} value={url} className="form-control" type="text" id="remoteurl" />
                </div>
            </div>


            <button className='btn btn-primary m-1' onClick={async () => {
                addRemote()
            }}>add remote</button><br></br>
            <hr></hr>
            <h4>Available remotes</h4>
            {
                remotes?.map((remote, index:number) => {
                    return <div key={index} className='row mb-1'>
                        <div className='col'>
                            <Card>
                                <Card.Body className='p-1'>
                                <input checked={currentRemote === remote.remote} onChange={async () => remoteChange(remote.remote)} type="radio" className='mr-2' value={remote.remote} id={remote.remote}
                                name="remote" />
                            <a className='mr-2' href={remote.url} target="_blank">{remote.remote}<br></br>{remote.url}</a>
                                </Card.Body>
                            </Card>

                        </div>
                        <div className='col'>
                            <button
                                onClick={async () =>
                                    await delRemote(remote.remote)
                                }
                                className="btn btn-danger btn-sm delete3b-btn mt-1"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </div>
                })
            }
            {(remotes && remotes?.length > 0) ? <></> : <div>No remotes are set</div>}
            <hr></hr>
        </>
    );
};
