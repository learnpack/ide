import toast from "react-hot-toast";
import { Modal } from "../../mockups/Modal";
import useStore from "../../../utils/store";

export const RigobotInviteModal = () => {

    const {openLink, bc_token, setOpenedModals} = useStore(state => ({
        openLink: state.openLink,
        bc_token: state.bc_token,
        setOpenedModals: state.setOpenedModals
    }))

  const closeModal = () => {
    toast.error("The user clicked outside the modal");
  };

  const acceptRigobot = () => {
    const inviteUrl = "https://rigobot.herokuapp.com/invite?referer=4geeks&token=" + bc_token;
    openLink(inviteUrl);
    setOpenedModals({rigobotInvite: false})
  }

  return (
    <Modal
      outsideClickHandler={closeModal}
      children={
        <>
          <h1>Missing Rigobot user</h1>
          <p>
            It appears that you didn't accept <strong>Rigobot's</strong>{" "}
            invitation yet. Learnpack uses Rigobot AI services under the hood,
            if you want to use the fabolous <strong>Learnpack Tutor</strong>,
            please accept Rigobot invitation!
          </p>
          <div>
            <button onClick={acceptRigobot} className="button ">Accept now</button>
          </div>
        </>
      }
    />
  );
};
