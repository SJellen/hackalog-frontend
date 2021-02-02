/* eslint-disable react/react-in-jsx-scope */
import {
    Div,
    Text,
    Icon,
    Row,
    Col,
    Button,
    Input,
    Tag,
} from "atomize"
import axios from "axios"
import { useRouter } from "next/router"
import { ListGroup, Container, Spinner } from "react-bootstrap"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { useAuth } from "../../../../../context/auth"
import { API_URL } from "../../../../../util/constants"
import Clipboard from "../../../../../components/Clipboard/Clipboard"
import Head from "next/head"

// team management
export default function ManageTeam() {
    const { token, loading } = useAuth()
    const [teamData, setTeamData] = useState({})
    const router = useRouter()
    const [localLoading, setLocalLoading] = useState(true) //During initial fetch on page loading.
    const [showSpinner, setSpinner] = useState(true) // while data is loading
    const [nameEdit, setNameEdit] = useState(false) // if name editing is in progress
    const [bufferTeamName, setBufferTeamName] = useState("") // buffer team name to handle editing of team name.
    const [members, editMembers] = useState([]) // for team members
    const [clientUser, editClientUser] = useState({}) // user who is logged in.

    useEffect(() => {
        async function getData() {
            try {
                axios.defaults.headers.common[
                    "Authorization"
                ] = `Token ${token}`
                const [responseTeam, responseUser] = await Promise.all([
                    axios.get(`${API_URL}teams/${router.query.team_id}/`),
                    axios.get(`${API_URL}profile/`),
                ])
                if (
                    responseTeam.status === 200 &&
                    responseUser.status === 200
                ) {
                    setTeamData(responseTeam.data)
                    editMembers(responseTeam.data.members)
                    editClientUser(responseUser.data)
                    console.log("responseTeam =", responseTeam)
                }
            } catch (exc) {
                setSpinner(false)
                console.log("Exception occcured!")
                console.log("exception responseTeam =", exc.response)
            }
        }
        if (token === null && !loading) {
            // router.push(/hackathon/${router.query.slug}`)
            router.push(
                `/hackathon/${router.query.slug}`
            )
        }
        if (token && !loading) {
            setLocalLoading(true)
            getData()
            setLocalLoading(false)
        }
    }, [token, router.query.team_id, loading, router])

    const notifHandler = (message, type) => {
        const config = {
            position:"top-center",
            autoClose:5000,
            hideProgressBar:false,
            newestOnTop:false,
            closeOnClick: true,
            rtl:false,
            pauseOnFocusLoss: true,
            draggable: true,
            pauseOnHover: true
        }
        switch (type) {
            case "info":
                toast.info(message, config)
                break
            case "error":
                toast.error(message, config)
                break
            case "warning":
                toast.warn(message, config)
                break
            case "success":
                toast.success(message, config)
                break
            default:
                toast.info(message, config)
        }
    }

    const checkToken = () => {
        if (token) {
            return true
        } else {
            notifHandler("You are not authenticated!", "error")
            return false
        }
    }

    const deleteTeam = async () => {
        if (!checkToken()) {
            return
        }
        checkToken()
        if (clientUser.username === teamData.leader.username) {
            try {
                const response = await axios.delete(
                    `${API_URL}teams/${router.query.team_id}/`
                )
                if (response.status === 204) {
                    notifHandler("Deleted Successfully!", "success")
                    setTimeout(() => {
                        // router.push(
                        //     `http://localhost:3000/hackathon/${teamData.hackathon.slug}`
                        // )
                        router.push(`/hackathon/${teamData.hackathon.slug}`)
                    }, 1000)
                } else {
                    notifHandler(
                        "Some unexpected error in client!",
                        "error"
                    )
                }
            } catch (exc) {
                console.log("exception in deleting the team: ", exc)
                if (exc.response.status === 404) {
                    notifHandler("Team not found!", "error")
                } else {
                    notifHandler("Facing server error!", "error")
                }
            }
        } else {
            notifHandler(
                "You are not allowed to perform this action",
                "warning"
            )
        }
    }

    const memberExit = async (name, isLeader) => {
        if (!checkToken()) {
            return
        }
        try {
            axios.defaults.headers.common["Authorization"] = `Token ${token}`
            const response = await axios.patch(
                `${API_URL}teams/${router.query.team_id}/member-exit/${name}`
            )
            if (response.status === 200) {
                if (isLeader) {
                    notifHandler("Removed Successfully!", "success")
                    setTimeout(() => {
                        router.reload()
                    }, 1000)
                } else {
                    notifHandler("Left Successfully!", "success")
                    setTimeout(() => {
                        // router.push(
                        //     `/hackathon/${teamData.hackathon.slug}`
                        // )
                        router.push(
                            `/hackathon/${teamData.hackathon.slug}`
                        )
                    }, 1000)
                }
            } else {
                notifHandler(
                    "Some unexpected error in client!",
                    "error"
                )
            }
        } catch (exc) {
            console.log("exc.response =", exc.response)
            switch (exc.response.status) {
                case 400:
                    notifHandler(`${exc.response.data[0]}`, "error")
                    return
                case 401:
                    notifHandler(`You are not authenticated`, "error")
                    return
                case 404:
                    notifHandler(`Hackathon not found`, "error")
                    return
                default:
                    notifHandler(
                        `Unexpected error from server`,
                        "info"
                    )
                    return
            }
        }
    }

    const leaderTag = (
        <Tag
            bg={`info500`}
            textColor="white"
            p={{ x: "0.75rem", y: "0.25rem" }}
            m={{ r: "0.5rem", b: "0.5rem" }}
        >
            Leader
        </Tag>
    )
    const handleMemberExitUI = (name) => {
        // return remove for every name except leader if client
        // is leader else return remove only for client
        if (
            teamData.leader.username === clientUser.username &&
            name !== clientUser.username
        ) {
            return (
                <Tag
                    bg={`info500`}
                    hoverBg="info600"
                    textColor="white"
                    p={{ x: "0.75rem", y: "0.25rem" }}
                    m={{ r: "0.5rem", b: "0.5rem" }}
                    onClick={() => {
                        console.log("Remove from team")
                        memberExit(name, true)
                    }}
                >
                    Remove
                </Tag>
            )
        } else if (
            clientUser.username === name &&
            teamData.leader.username !== clientUser.username
        ) {
            return (
                <Tag
                    bg={`info500`}
                    hoverBg="info600"
                    textColor="white"
                    p={{ x: "0.75rem", y: "0.25rem" }}
                    m={{ r: "0.5rem", b: "0.5rem" }}
                    onClick={() => {
                        console.log("Leave the team")
                        memberExit(name, false)
                    }}
                >
                    Leave Team
                </Tag>
            )
        } else {
            return null
        }
    }

    const membersUI = members.map((el, index) => {
        return (
            <Row key={el.username}>
                <ListGroup.Item action>
                    <Row justify="space-between">
                        <Text
                            tag="h6"
                            textSize="title"
                            textColor="gray800"
                            fontFamily="madetommy-regular"
                            m={{ r: "1rem" }}
                        >
                            {index + 1}. {el.username}
                        </Text>
                        {el.username === teamData.leader.username
                            ? leaderTag
                            : null}
                        {el.username === teamData.leader.username &&
                        clientUser.username === teamData.leader.username ? (
                            <Tag
                                bg={`info500`}
                                hoverBg="info600"
                                textColor="white"
                                p={{ x: "0.75rem", y: "0.25rem" }}
                                m={{ r: "0.5rem", b: "0.5rem" }}
                                onClick={() => {
                                    console.log("Handle team deletion")
                                    deleteTeam()
                                }}
                            >
                                Delete Team
                            </Tag>
                        ) : null}
                        {handleMemberExitUI(el.username)}
                    </Row>
                </ListGroup.Item>
            </Row>
        )
    })

    const changeName = async () => {
        const normalizeState = () => {
            setSpinner(false)
            setNameEdit(false)
            setBufferTeamName("")
        }
        if (!checkToken()) {
            normalizeState()
            return
        }
        if (bufferTeamName === "") {
            normalizeState()
            return
        }
        try {
            const response = await axios.patch(
                `${API_URL}teams/${router.query.team_id}/`,
                { name: bufferTeamName }
            )
            if (response.status === 200) {
                normalizeState()
                notifHandler("Update successfull!", "success")
                setTeamData(response.data)
            } else {
                normalizeState()
                notifHandler("Unexpected error in client!", "warning")
            }
        } catch (exc) {
            console.log("Exception in updating the name:", exc.response)
            normalizeState()
            if (exc.response.status === 404) {
                notifHandler("Team not found!", "warning")
            } else if (exc.response.status === 403) {
                notifHandler(`${exc.response.data.detail}`, "warning")
            } else {
                notifHandler(
                    "Unexpected error from server!", "error"
                )
            }
        }
    }

    return (
        <>
            <Head>
                <title>Team Page</title>
                <meta name="description" content="Team's page for hackathon" />
            </Head>
            {localLoading ? (
                <Container className="text-center">
                    <Spinner
                        style={{
                            position: "absolute",
                            top: "50%",
                        }}
                        className="mt-auto mb-auto"
                        animation="border"
                        role="status"
                    >
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                </Container>
            ) : (
                <>
                    <Row
                        justify="center"
                        m={{ t: "3.5rem", b: "2.5rem", x: "0.5rem" }}
                    >
                        <Text
                            tag="h2"
                            textSize="display2"
                            textColor="#003e54"
                            fontFamily="madetommy-regular"
                            textDecor="underline"
                            textAlign="center"
                        >
                            Team: {teamData.name}
                        </Text>
                    </Row>
                    <Row justify="center">
                        <Col size={{ xs: "12", md: "10" }}>
                            <Div
                                bg="white"
                                shadow={{ md: "4" }}
                                rounded="xl"
                                m={{ b: "1rem" }}
                            >
                                <Row
                                    m={{ x: "0.5rem", y: "1rem" }}
                                    justify="space-between"
                                >
                                    <Col
                                        size={{ xs: "12", md: "6" }}
                                        m={{ y: "0.5rem" }}
                                    >
                                        <Clipboard
                                            code={teamData.team_id}
                                            notify={() => {
                                                notifHandler(
                                                    "Code copied!",
                                                    "success"
                                                )
                                            }}
                                        ></Clipboard>
                                    </Col>
                                    {!nameEdit ? (
                                        <Col
                                            size={{ xs: "12", md: "6" }}
                                            m={{ y: "0.5rem" }}
                                        >
                                            <Row>
                                                <Text
                                                    tag="h4"
                                                    textSize="title"
                                                    textColor="#003e54"
                                                    fontFamily="madetommy-regular"
                                                    m={{ r: "1rem" }}
                                                >
                                                    Team Name:
                                                </Text>
                                                <Text
                                                    tag="h6"
                                                    textSize="title"
                                                    textColor="gray800"
                                                    fontFamily="madetommy-regular"
                                                    m={{ r: "1rem" }}
                                                >
                                                    {teamData.name}
                                                </Text>
                                                <Button
                                                    h="2.5rem"
                                                    w="2.5rem"
                                                    rounded="circle"
                                                    m={{ r: "1rem" }}
                                                    onClick={() => {
                                                        setNameEdit(true)
                                                    }}
                                                    bg="#178a80"
                                                    hoverBg="success600"
                                                    hoverShadow="3"
                                                    title="Edit"
                                                >
                                                    <Icon
                                                        name="Edit"
                                                        size="20px"
                                                        color="white"
                                                    />
                                                </Button>
                                            </Row>
                                        </Col>
                                    ) : (
                                        <Col
                                            size={{ xs: "12", md: "6" }}
                                            m={{ y: "0.5rem" }}
                                        >
                                            <Row>
                                                <Text
                                                    tag="h4"
                                                    textSize="title"
                                                    textColor="#003e54"
                                                    fontFamily="madetommy-regular"
                                                    m={{ r: "1rem" }}
                                                >
                                                    Team Name:
                                                </Text>
                                                <Input
                                                    placeholder={teamData.name}
                                                    onChange={(e) => {
                                                        setBufferTeamName(
                                                            e.target.value
                                                        )
                                                    }}
                                                ></Input>
                                                <Button
                                                    onClick={() => {
                                                        setSpinner(true)
                                                        changeName()
                                                    }}
                                                    w="3rem"
                                                    bg="#178a80"
                                                    hoverBg="success600"
                                                    m={{ x: "0.5rem" }}
                                                >
                                                    {showSpinner ? (
                                                        <Icon
                                                            name="Loading2"
                                                            size="20px"
                                                            color="white"
                                                        />
                                                    ) : (
                                                        "Done"
                                                    )}
                                                </Button>
                                                <Button
                                                    disabled={showSpinner}
                                                    onClick={() => {
                                                        setNameEdit(false)
                                                        setBufferTeamName("")
                                                    }}
                                                    w="3rem"
                                                    bg="#178a80"
                                                    hoverBg="success600"
                                                >
                                                    Back
                                                </Button>
                                            </Row>
                                        </Col>
                                    )}
                                </Row>
                                <Row m={{ y: "1rem" }}>
                                    <Col size={{ xs: "12" }}>
                                        <Text
                                            tag="h4"
                                            textSize="title"
                                            textColor="#003e54"
                                            fontFamily="madetommy-regular"
                                            m={{ r: "1rem" }}
                                        >
                                            Members:
                                        </Text>
                                        <Div
                                            m={{
                                                t: "0.5rem",
                                                b: "1.5rem",
                                                x: "1rem",
                                            }}
                                        >
                                            <ListGroup>{membersUI}</ListGroup>
                                        </Div>
                                    </Col>
                                </Row>
                            </Div>
                        </Col>
                    </Row>
                </>
            )}
        </>
    )
}