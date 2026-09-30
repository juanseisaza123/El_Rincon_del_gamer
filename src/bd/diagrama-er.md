    AUTH_USERS ||--|| USUARIOS : "perfil de"
    ROLES ||--o{ USUARIOS : clasifica
    USUARIOS ||--|| PREFERENCIAS_USUARIO : configura
    USUARIOS ||--o{ SEGUIMIENTOS : "sigue"
    USUARIOS ||--o{ COMUNIDADES : funda
    USUARIOS ||--o{ COMUNIDAD_MIEMBROS : participa
    COMUNIDADES ||--o{ COMUNIDAD_MIEMBROS : tiene
    USUARIOS ||--o{ PUBLICACIONES : publica
    COMUNIDADES ||--o{ PUBLICACIONES : contiene
    PUBLICACIONES ||--o| ENCUESTAS : incluye
    ENCUESTAS ||--o{ ENCUESTA_OPCIONES : tiene
    ENCUESTA_OPCIONES ||--o{ ENCUESTA_VOTOS : recibe
    USUARIOS ||--o{ ENCUESTA_VOTOS : vota
    PUBLICACIONES ||--o{ COMENTARIOS : recibe
    USUARIOS ||--o{ COMENTARIOS : escribe
    PUBLICACIONES ||--o{ LIKES : recibe
    USUARIOS ||--o{ LIKES : da
    USUARIOS ||--o{ CONVERSACION_PARTICIPANTES : participa
    CONVERSACIONES ||--o{ CONVERSACION_PARTICIPANTES : incluye
    CONVERSACIONES ||--o{ MENSAJES : contiene
    USUARIOS ||--o{ MENSAJES : envia
    USUARIOS ||--o{ NOTIFICACIONES : recibe
    USUARIOS ||--o{ REPORTES_MODERACION : denuncia

    AUTH_USERS {
        uuid id PK "gestionada por Supabase Auth"
        varchar email
        varchar encrypted_password "hash interno, no se toca"
    }
    ROLES {
        int id PK
        varchar nombre
    }
    USUARIOS {
        uuid id PK_FK "= auth.users.id"
        varchar handle UK
        varchar nombre
        varchar bio
        varchar avatar_url
        int rol_id FK
        varchar estado "activo | baneado"
        datetime creado_en
        datetime actualizado_en
        datetime eliminado_en "soft delete"
    }
    PREFERENCIAS_USUARIO {
        uuid usuario_id PK_FK
        varchar tema
        boolean cursor_gamer
        boolean glow_effect
    }
    SEGUIMIENTOS {
        int id PK
        uuid seguidor_usuario_id FK
        uuid seguido_usuario_id FK
        varchar estado "pendiente | aceptado"
        datetime creado_en
    }
    COMUNIDADES {
        int id PK
        varchar nombre
        varchar categoria
        varchar descripcion
        varchar avatar_url
        varchar banner_url
        uuid creador_usuario_id FK
        datetime creado_en
    }
    COMUNIDAD_MIEMBROS {
        int id PK
        int comunidad_id FK
        uuid usuario_id FK
        varchar rol_comunidad "fundador | miembro"
        datetime unido_en
    }
    PUBLICACIONES {
        int id PK
        uuid autor_usuario_id FK
        int comunidad_id FK "nulo = feed general"
        varchar contenido
        varchar enlace_url
        varchar media_url
        varchar media_tipo "imagen | video"
        datetime creado_en
        datetime editado_en
        datetime eliminado_en
    }
    ENCUESTAS {
        int id PK
        int publicacion_id FK UK
        varchar pregunta
    }
    ENCUESTA_OPCIONES {
        int id PK
        int encuesta_id FK
        varchar texto
    }
    ENCUESTA_VOTOS {
        int id PK
        int encuesta_id FK
        int opcion_id FK
        uuid usuario_id FK
        datetime creado_en
    }
    COMENTARIOS {
        int id PK
        int publicacion_id FK
        uuid autor_usuario_id FK
        varchar contenido
        datetime creado_en
        datetime eliminado_en
    }
    LIKES {
        int id PK
        int publicacion_id FK
        uuid usuario_id FK
        datetime creado_en
    }
    CONVERSACIONES {
        int id PK
        varchar tipo "privada | grupal"
        varchar nombre "solo grupal"
        datetime creado_en
    }
    CONVERSACION_PARTICIPANTES {
        int id PK
        int conversacion_id FK
        uuid usuario_id FK
        datetime unido_en
    }
    MENSAJES {
        int id PK
        int conversacion_id FK
        uuid autor_usuario_id FK
        varchar contenido
        datetime creado_en
    }
    NOTIFICACIONES {
        int id PK
        uuid usuario_id FK
        varchar tipo "seguimiento | like | comentario | mensaje | comunidad | reporte"
        varchar contenido
        varchar referencia_tipo "publicacion | comentario | usuario | comunidad | conversacion"
        int publicacion_id FK "nullable"
        int comentario_id FK "nullable"
        uuid usuario_relacionado_id FK "nullable"
        int comunidad_id FK "nullable"
        int conversacion_id FK "nullable"
        boolean leida
        datetime creado_en
    }
    REPORTES_MODERACION {
        int id PK
        uuid denunciante_usuario_id FK
        varchar tipo_objetivo "publicacion | comentario | usuario | comunidad"
        int publicacion_id FK "nullable"
        int comentario_id FK "nullable"
        uuid usuario_reportado_id FK "nullable"
        int comunidad_id FK "nullable"
        varchar motivo
        varchar estado "pendiente | revisado | descartado"
        uuid revisado_por_usuario_id FK
        datetime creado_en
    }