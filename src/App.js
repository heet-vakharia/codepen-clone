import React, { useEffect, useState } from "react";
import { Route, useHistory } from "react-router-dom";
import EditorPage from "./pages/EditorPage/editor.pages";
import Signin from "./Components/Signin/Signin.component";
import useLocalStorage from "./hooks/useLocalStorage.hooks";
import Homepage from "./pages/Homepage/Homepage.pages";
import Loader from "./Components/Loader/Loader.component";
import { auth, db } from "./firebase";
function App() {
  const history = useHistory();
  const [user, setUser] = useLocalStorage("CurrentUser", {});
  const [isUserSignin, setIsUserSignin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handelAuth = async () => {
    auth.onAuthStateChanged(async (user) => {
      setIsLoading(true);
      if (user) {
        const { displayName, photoURL, uid } = user;

        const { docs } = await db.collection("users").get();
        const newUser = docs.filter((doc) => doc.data().uid === uid);

        if (!newUser.length) {
          const docRef = await db.collection(`users`).add({
            photoURL,
            displayName,
            uid,
          });
          const doc = await docRef.get();
          const userRef = await db.collection(`users/${doc.id}/pens`).add({
            name: "Demo Pen",
            code: {
              html: "",
              css: "",
              js: "",
            },
          });
          const pens = await userRef.get();
          setUser({
            id: doc.id,
            ...doc.data(),
            pens: [
              {
                id: pens.id,
                ...pens.data(),
              },
            ],
          });
          history.push("/");
          setIsLoading(false);
          setIsUserSignin(true);
        } else {
          const { id } = newUser[0];
          const data = newUser[0].data();
          const pensArr = [];
          const pens = await db.collection(`users/${id}/pens`).get();
          pens.docs.forEach((doc) => {
            pensArr.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          setUser({
            id: id,
            ...data,
            pens: pensArr,
          });
          setIsUserSignin(true);
          setIsLoading(false);
        }
      }
    });
  };
  useEffect(() => {
    handelAuth();
    var unsubscribe = db
      .collection(`users/${user.id}/pens`)
      .onSnapshot((snapshot) => {
        const newUser = user;
        newUser.pens = [];
        snapshot.docs.forEach((doc) => {
          newUser.pens.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setUser(user);
      });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="App">
      {isLoading ? <Loader isLoading={isLoading} /> : null}
      <Route
        path="/"
        exact
        render={() => (
          <Homepage
            user={user}
            setUser={setUser}
            isUserSignin={isUserSignin}
            setIsUserSignin={setIsUserSignin}
          />
        )}
      />

      <Route
        path="/signin"
        exact
        render={() => (
          <Signin
            user={user}
            setUser={setUser}
            isUserSignin={isUserSignin}
            setIsLoading={setIsLoading}
          />
        )}
      />

      <Route
        path="/newPen"
        exact
        render={() => (
          <EditorPage
            user={user}
            setUser={setUser}
            isUserSignin={isUserSignin}
          />
        )}
      />
      <Route
        path="/:userid/pen/:id"
        exact
        render={() => <EditorPage user={user} isUserSignin={isUserSignin} />}
      />
    </div>
  );
}

export default App;
