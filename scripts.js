
const API_URL = 'http://127.0.0.1:5001/atividade';
const API_URL_ALL = 'http://127.0.0.1:5001/atividades';

const map = L.map('map').setView([-22.978456, -43.233979], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> José Matos@2023 | PUC-RIO | MVP - Sprint: Desenvolvimento Back-end Avançado',
    maxZoom: 19
}).addTo(map);

const handleErrors = (status) => {
    switch (status) {
        case 409:
            alert('Atividade de mesma data já cadastrada.');
            break;
        case 400:
            alert('Atividade não cadastrada. Verifique os campos e tente novamente.');
            break;
        default:
            alert('Ocorreu um erro na requisição. Por favor, tente novamente.');
    }
};


const postItem = async (activityData) => {
    const formData = new FormData();
    for (const key in activityData) {
        formData.append(key, activityData[key]);
    }

    try {
        const response = await fetch(API_URL, {
            method: 'post',
            body: formData
        });

        if (!response.ok) {
            handleErrors(response.status);
            throw new Error('Error in response');
        } else {
            alert('Atividade Cadastrada com sucesso!');
            retrieveActivities();
        }

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

// Array global para armazenar os marcadores
let markers = [];

const deleteActivity = async (id) => {
    map.closePopup();
    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error deleting activity');
        }

        const result = await response.json();

        if (result.message === "Atividade e suas observações foram removidas") {
            alert('Atividade excluída com sucesso!');
            retrieveActivities();  // Chame retrieveActivities após a exclusão bem-sucedida para atualizar o mapa
        } else {
            alert('Ocorreu um erro ao tentar excluir a atividade.');
        }

    } catch (error) {
        console.error('Error:', error);
        alert("Ocorreu um erro ao tentar excluir a atividade.");
    }

};

let selectedActivity = null;

function createObservationsList(observacoes) {
    //console.log("Observações recebidas:", observacoes);  // Log para debug
    let list = '<div class="activity-field observations-field"><label>Observações:</label><ul>';
    observacoes.forEach(obs => {
        list += `<li>${obs.texto} (Obs feita em: ${obs.data_insercao})</li>`;
    });
    list += '</ul></div>';
    //console.log("Lista gerada:", list);  // Log para debug
    return list;
}

const retrieveActivities = async () => {
    try {
        // Remover todos os marcadores antigos antes de adicionar novos
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];  // Limpar o array de marcadores

        const response = await fetch(API_URL_ALL);
        if (!response.ok) {
            throw new Error('Error fetching activities');
        }
        const data = await response.json();

        data.atividades.forEach(activity => {
            const formattedDuration = decimalToHHMM(activity.duracao);
            const marker = L.marker([activity.latitude, activity.longitude], { draggable: true }).addTo(map);
            marker.markerData = {
                id: activity.id,
                latitude: activity.latitude,
                longitude: activity.longitude
            };
            marker.on('click', function() {
                selectedActivity = this.markerData;
            });
            markers.push(marker);
            const observationsList = activity.observacoes ? createObservationsList(activity.observacoes) : '';



            marker.bindPopup(`
            <div class="popup-container">
            <div class="activity-field">
            <div class="title">
            <h3>Controle de Atividades</h3>
            </div>
            <label>Data:</label>
            <input class="input-field" type="date" value="${activity.data}" id="edit-data-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Início:</label>
            <input class="input-field" type="time" value="${activity.start_time}" id="edit-start_time-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Fim:</label>
            <input class="input-field" type="time" value="${activity.end_time}" id="edit-end_time-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Duração:</label>
            <input class="input-field" type="text" value="${formattedDuration}" id="edit-duracao-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Estudos:</label>
            <input class="input-field" type="number" value="${activity.estudos}" id="edit-estudos-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Publicações:</label>
            <input class="input-field" type="number" value="${activity.publicacoes}" id="edit-publicacoes-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Revisitas:</label>
            <input class="input-field" type="number" value="${activity.revisitas}" id="edit-revisitas-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Vídeos:</label>
            <input class="input-field" type="number" value="${activity.videos}" id="edit-videos-${activity.id}" disabled />
            </div>
            <div class="activity-field">
            <label>Informações do Local:</label>
            <textarea class="input-field" id="edit-endereco-${activity.id}" disabled>${activity.endereco}</textarea>
            </div>
           
            ${observationsList}
            <div class="button-group">
            <button class="btn" onclick="addObservation(${activity.id})" aria-label="Criar observação">Adicionar Observação</button>
            <button data-id="${activity.id}" class="btn" onclick="editActivity(event)" aria-label="Editar atividade">Editar</button>
            <button class="btn" onclick="updateActivity()" aria-label="Atualizar dados da atividade">Atualizar</button>
            <button class="btn" onclick="deleteActivity(${activity.id})" aria-label="Excluir atividade">Excluir</button>
           
            </div>
            </div>
            `);
            

        });
        
    } catch (error) {
        console.error('Error:', error);
    }
    
};

document.addEventListener('DOMContentLoaded', function () {
    retrieveActivities();
});


map.on('click', function (e) {

    const popupContent = `
    <form id="activity-form">
        <div class="activity-field">
            <label>Data:</label>
            <input class="input-field" type="date" id="data" required>
        </div>
        <div class="activity-field">
            <label>Início:</label>
            <input class="input-field" type="time" id="start_time" required oninput="calculateDuration()">
        </div>
        <div class="activity-field">
            <label>Fim:</label>
            <input class="input-field" type="time" id="end_time" required oninput="calculateDuration()">
        </div>
        <div class="activity-field">
            <label>Duração:</label>
            <input class="input-field" type="text" id="duracao" readonly>
        </div>
        <div class="activity-field">
            <label>Estudos:</label>
            <input class="input-field" type="number" id="estudos" required min="0">
        </div>
        <div class="activity-field">
            <label>Publicações:</label>
            <input class="input-field" type="number" id="publicacoes" required min="0">
        </div>
        <div class="activity-field">
            <label>Revisitas:</label>
            <input class="input-field" type="number" id="revisitas" required min="0">
        </div>
        <div class="activity-field">
            <label>Vídeos:</label>
            <input class="input-field" type="number" id="videos" required min="0">
        </div>
        <div class="activity-field">
            <label>Informações do Local:</label>
            <input class="input-field" type="text" id="endereco" readonly>
        </div>
        
        <div class="button-group">
            <button type="button" class="btn" onclick="adicionarAtividade(${e.latlng.lat}, ${e.latlng.lng})" aria-label="Salvar atividade">Salvar</button>
        </div>
    </form>
`;

    L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);
});


const adicionarAtividade = (lat, lng) => {
    const form = document.getElementById("activity-form");
    const activityData = {
        latitude: lat,
        longitude: lng,
        data: form.querySelector("#data").value,
        start_time: form.querySelector("#start_time").value,
        end_time: form.querySelector("#end_time").value,
        duracao: parseFloat(document.getElementById('duracao').getAttribute('data-duration-decimal')),
        estudos: form.querySelector("#estudos").value,
        publicacoes: form.querySelector("#publicacoes").value,
        revisitas: form.querySelector("#revisitas").value,
        videos: form.querySelector("#videos").value,
        endereco: form.querySelector("#endereco").value,


    };
    postItem(activityData);
    map.closePopup();
};
const calculateDuration = () => {
    const startTimeElement = document.getElementById('start_time');
    const endTimeElement = document.getElementById('end_time');
    const durationElement = document.getElementById('duracao');

    const startTime = startTimeElement.value.split(':');
    const endTime = endTimeElement.value.split(':');

    const start = new Date(0, 0, 0, startTime[0], startTime[1], 0);
    const end = new Date(0, 0, 0, endTime[0], endTime[1], 0);

    // Calculando a diferença em minutos
    let durationInMinutes = (end - start) / (1000 * 60);

    if (durationInMinutes < 0) {
        alert('O tempo de início não pode ser maior que o tempo de fim!');
        startTimeElement.value = '';
        endTimeElement.value = '';
        durationElement.value = '';
        return;
    }

    // Convertendo minutos para o formato hh:mm
    const formattedDuration = decimalToHHMM(durationInMinutes / 60);

    // Atualizando o campo de duração no popup com o formato hh:mm
    durationElement.value = formattedDuration;

    // Convertendo a duração para decimal (esta será a duração a ser enviada para o servidor)
    const durationInDecimal = hhmmToDecimal(formattedDuration);

    // Se você quiser armazenar o valor em decimal para ser enviado posteriormente, pode fazer algo como:
    durationElement.setAttribute('data-duration-decimal', durationInDecimal);
};

const decimalToHHMM = (decimalTime) => {
    const hours = Math.floor(decimalTime);
    const minutes = Math.round((decimalTime - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
const hhmmToDecimal = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
};

// Função para adicionar observação
async function addObservation(activityId) {
    try {
        const observationText = prompt("Por favor, insira o texto da observação:");

        if (!observationText) {
            return;
        }

        const formData = new FormData();
        formData.append("atividade_id", activityId);
        formData.append("texto", observationText);

        const response = await fetch('http://127.0.0.1:5001/observacao', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
            },
            body: formData
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || "Falha ao adicionar observação");
        }

        alert("Observação adicionada com sucesso!");
        retrieveActivities();
    } catch (error) {
        console.error("Error:", error);
        alert("Erro ao criar observação!");
    }
}



function editActivity(event) {
    const activityId = event.target.getAttribute("data-id");

    // Ativar campos de entrada
    document.getElementById(`edit-data-${activityId}`).removeAttribute("disabled");
    document.getElementById(`edit-start_time-${activityId}`).removeAttribute("disabled");
    document.getElementById(`edit-end_time-${activityId}`).removeAttribute("disabled");

    document.getElementById(`edit-estudos-${activityId}`).removeAttribute("disabled");
    document.getElementById(`edit-publicacoes-${activityId}`).removeAttribute("disabled");
    document.getElementById(`edit-revisitas-${activityId}`).removeAttribute("disabled");
    document.getElementById(`edit-videos-${activityId}`).removeAttribute("disabled");

    // Repita para outros campos...

    // Ocultar o botão "Editar" e mostrar o botão "Salvar"
    event.target.style.display = 'none';
    event.target.nextElementSibling.style.display = 'block';
}


// Função para calcular a duração
const calculatDuration = (startTimeId, endTimeId, durationId) => {
    const startTimeElement = document.getElementById(startTimeId);
    const endTimeElement = document.getElementById(endTimeId);
    const durationElement = document.getElementById(durationId);

    const startTime = startTimeElement.value.split(':');
    const endTime = endTimeElement.value.split(':');

    const start = new Date(0, 0, 0, startTime[0], startTime[1], 0);
    const end = new Date(0, 0, 0, endTime[0], endTime[1], 0);

    // Calculando a diferença em minutos
    let durationInMinutes = (end - start) / (1000 * 60);

    if (durationInMinutes < 0) {
        alert('O tempo de início não pode ser maior que o tempo de fim!');
        startTimeElement.value = '';
        endTimeElement.value = '';
        durationElement.value = '';
        return;
    }

    // Convertendo minutos para o formato hh:mm
    const formattedDuration = decimalToHHMM(durationInMinutes / 60);

    // Atualizando o campo de duração com o formato hh:mm
    durationElement.value = formattedDuration;

    // Convertendo a duração para decimal (esta será a duração a ser enviada para o servidor)
    const durationInDecimal = hhmmToDecimal(formattedDuration);
    return durationInDecimal; // retornando o valor em decimal
};

const updateActivity = async () => {
    
    if (!selectedActivity) {
        alert('Por favor, selecione uma atividade primeiro.');
        return;
    }
    
    try {
        
        const activityData = {
            id: selectedActivity.id,
            data: document.getElementById('edit-data-' + selectedActivity.id).value,
            start_time: document.getElementById('edit-start_time-' + selectedActivity.id).value,
            end_time: document.getElementById('edit-end_time-' + selectedActivity.id).value,
            duracao: calculatDuration(
                'edit-start_time-' + selectedActivity.id,
                'edit-end_time-' + selectedActivity.id,
                'edit-duracao-' + selectedActivity.id
            ), // chamada à função para calcular a duração
            estudos: parseInt(document.getElementById('edit-estudos-' + selectedActivity.id).value, 10),
            publicacoes: parseInt(document.getElementById('edit-publicacoes-' + selectedActivity.id).value, 10),
            revisitas: parseInt(document.getElementById('edit-revisitas-' + selectedActivity.id).value, 10),
            videos: parseInt(document.getElementById('edit-videos-' + selectedActivity.id).value, 10),
            endereco: document.getElementById('edit-endereco-' + selectedActivity.id).value,
            latitude: selectedActivity.latitude,
            longitude: selectedActivity.longitude
        };


        const formData = new FormData();
        for (const key in activityData) {
            formData.append(key, activityData[key]);
        }

        const response = await fetch(API_URL, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error updating activity');
        }
       
        const result = await response.json();

        if (result.message === "Atividade atualizada com sucesso!") {
            alert('Atividade atualizada com sucesso!');
            map.closePopup();
            retrieveActivities();
        } else {
            alert('Ocorreu um erro ao tentar atualizar a atividade.');
        }

    } catch (error) {
        console.error('Error:', error);
        alert("Ocorreu um erro ao tentar atualizar a atividade.");
    }
};




// Inicializar marcadores no mapa
retrieveActivities();
