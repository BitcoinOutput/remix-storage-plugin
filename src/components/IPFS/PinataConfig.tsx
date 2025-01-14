import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { client, ipfservice, useLocalStorage, Utils } from "../../App";

interface PinataConfigProps {}

export const PinataConfig: React.FC<PinataConfigProps> = ({}) => {
  const [key, setKey] = useLocalStorage("pinatakey", "");
  const [secret, setSecret] = useLocalStorage("pinatasecret", "");
  const [status, setStatus] = useState<boolean>(false);

  const setKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKey(e.currentTarget.value);
    setConfig();
  };
  const setSecretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.currentTarget.value);
    setConfig();
  };

  useEffect(() => {
    const check = async () => {
      client.onload(async () => {
        await checkconfig();
      });
    };
    check();
  }, []);

  const checkconfig = async () => {
    toast.dismiss();
    try {
      setTimeout(() => {
        client.cancel('dGitProvider' as any, 'pinList')
      },3000)
      let r = await client.call("dGitProvider" as any, "pinList", key, secret);
      setStatus(true);
      ipfservice.pinataConnectionStatus.next(false);
      ipfservice.pinataConnectionStatus.next(true);
      setConfig();
    } catch (err) {
      Utils.log(err);
      setStatus(false);
      ipfservice.pinataConnectionStatus.next(false);
    }
  };

  const setConfig = async () => {
    ipfservice.pinataConfig = {
      key: key,
      secret: secret,
    };
  };

  return (
    <>
      <hr></hr>
      <h5>Pinata API credentials</h5>
      <label>API KEY</label>
      <input
        onChange={setKeyChange}
        className="form-control w-100"
        type="text"
        id="protocol"
        value={key}
      />
      <label>API SECRET</label>
      <input
        onChange={setSecretChange}
        className="form-control w-100"
        type="text"
        id="url"
        value={secret}
      />
      <button id='btncheckpinata' className="btn btn-primary mt-5" onClick={checkconfig}>
        Check connection
      </button>
      {status ? (
        <div id='pinatachecksuccess' className="alert alert-success w-md-25 w-100 mt-2" role="alert">
          Your pinata settings are working correctly.
        </div>
      ) : (
        <div id='pinatacheckerror' className="alert alert-warning w-md-25 w-100 mt-2" role="alert">
          Your pinata settings are incorrect. Unable to connect. Check your
          settings.
        </div>
      )}
    </>
  );
};
